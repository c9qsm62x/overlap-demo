const Knex = require("knex");
const knexConfig = require("./knexfile");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const vehicles = require("./data/job");
const cors = require("cors");
const elements = require("./data/event");
const sortSweep = require("./sorter");

const knex = Knex(knexConfig.development);
const app = express();

app.use(express.json());

app.use(cors());
const cache = {
  fe: null,
  se: {},
  seDB: {},
};

app.use(express.static('frontend/build'))

app.get("/job", async (req, res) => {
  const data = await knex("job").select("*");

  res.json(data);
});

app.get("/job/item", async (req, res) => {
  const searchParams = new URLSearchParams(req.query);
  const start = searchParams.get("start_date");
  const end = searchParams.get("end_date");
  const jobQuery = knex("job").select("*");

  const job = await jobQuery;

  const data = job.map((j) => {
    return knex.raw(
      `
            SELECT * from event where
            tstzrange(event.start, event.end) &&
            tstzrange(:start, :end)
            And event.job = :job
            ORDER BY start ASC
          `,
      {
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        job: j.id,
      }
    );
  });
  const t = await Promise.all(data);

  res.json(
    job.map((j, i) => {
      return {
        ...j,
        events: t[i].rows,
      };
    })
  );
});

app.get("/job/:jobId/item", async (req, res) => {
  const jobId = req.params.jobId;
  const searchParams = new URLSearchParams(req.query);
  const start = searchParams.get("start_date");
  const end = searchParams.get("end_date");
  const jobQuery = knex("job").select("*").where("id", jobId);

  const job = await jobQuery;

  const data = job.map((j) => {
    return knex.raw(
      `
            SELECT * from event where
            tstzrange(event.start, event.end) &&
            tstzrange(:start, :end)
            And event.job = :job
            ORDER BY start ASC
          `,
      {
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        job: jobId,
      }
    );
  });
  const t = await Promise.all(data);

  const json = job.map((j, i) => {
    return {
      ...j,
      events: t[i].rows,
    };
  })[0];

  res.json(json);
});

app.post("/item/", async (req, res) => {
  const createdId = await knex("event")
    .returning("id")
    .insert({
      id: uuidv4(),
      start: new Date(req.body.start),
      end: new Date(req.body.end),
      job: req.body.job,
      row: 0,
      description: req.body.description,
    })
    .then((row) => {
      return row[0];
    });

  await overlappingSort({
    start: req.body.start,
    end: req.body.end,
    jobId: req.body.job,
  });

  const event = await knex("event").select("*").where("id", createdId);
  res.status(201).json(event);
});

app.put("/item/:itemId", async (req, res) => {
  const itemId = req.params.itemId;

  const current = await knex("event")
    .select(["start", "end"])
    .where("id", itemId);

  await knex("event")
    .where("id", itemId)
    .update({
      start: new Date(req.body.start),
      end: new Date(req.body.end),
      job: req.body.job,
      updated_at: new Date(Date.now()),
      row: 0,
      description: req.body.description,
    });

  await overlappingSort({
    start: current[0].start,
    end: current[0].end,
    jobId: req.body.job,
  });

  await overlappingSort({
    start: req.body.start,
    end: req.body.end,
    jobId: req.body.job,
  });

  const events = await knex("event").select("*").where("id", itemId);

  res.status(200).json(events);
});

app.delete("/item/:itemId", async (req, res) => {
  const itemId = req.params.itemId;
  const event = await knex("event")
    .select(["start", "end", "job"])
    .where("id", itemId);
  if (!event.length) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await knex("event").where({ id: itemId }).del();

  await overlappingSort({
    start: event[0].start,
    end: event[0].end,
    jobId: event[0].job,
  });

  res.status(200).json({ deleted: itemId });
});

app.listen(3001, () => {
  console.log("running on 3001");
});

async function overlappingSort({ start, end, jobId }) {
  const overlappingMaxMin = await knex.raw(
    `
    WITH RECURSIVE data AS (
      SELECT 

       count(id) as n,
        MIN(event.start)  as min, 
        MAX(event.end) as max ,
        event.job
        FROM event 
        WHERE
      tstzrange(event.start, event.end) &&
      tstzrange(:start, :end)
      AND event.job = :job
      GROUP BY event.job
        UNION ALL
          select 
          n,
          min, 
          max ,
          job
          
          from (SELECT 
            count(id) as n,
            MIN(event.start)  as min, 
            MAX(event.end) as max ,
            event.job,
            MIN(c_min) as cc_min,
            MAX(c_max) as cc_max
            FROM event 
            INNER JOIN 
            (
              SELECT min as c_min,
              max as c_max,  data.job as dataeventjob,
              n as current_n
              FROM data
            ) AS dataEvent
            ON dataeventjob = event.job
            WHERE
          tstzrange(event.start, event.end) &&
          tstzrange(c_min, c_max)
          AND event.job = :job
          GROUP BY event.job
          ) as d
          where d.max > d.cc_max or d.min < d.cc_min 
      )
      select MIN(min), 
      MAX(max) as max from data  GROUP BY job LIMIT 10;
    `,
    {
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      job: jobId,
    }
  );

  const { min, max } = overlappingMaxMin.rows[0];
  const overlapping = await knex.raw(
    `
          SELECT  * from event where
          tstzrange(event.start, event.end) &&
          tstzrange(:start, :end)
          And event.job = :job
          ORDER BY start ASC
        `,
    {
      start: new Date(min).toISOString(),
      end: new Date(max).toISOString(),
      job: jobId,
    }
  );

  return knex.transaction((trx) => {
    const queries = sortSweep(overlapping.rows, 0).flatMap((row, i) => {
      return row.map(({ startTime, endTime, id, ...rest }) => {
        return knex("event").transacting(trx).where({ id }).update({ row: i });
      });
    });

    return Promise.all(queries).then(trx.commit).catch(trx.rollback);
  });
}
