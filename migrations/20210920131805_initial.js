;

exports.up = async function(knex) {

    await knex.schema.createTable("job", (table) => {
        table.uuid("id").primary();
        
        table.timestamps(true, true);
        table.string("name", 255)
      });

    await knex.schema.createTable("event", (table) => {
        table.uuid("id").primary();
        table.timestamps(true, true);
        table.datetime('start')
        table.datetime('end')
        table.uuid("job");
        table.integer("row");
        table.string("description", 255)
        table.foreign("job")
            .references("id")
            .inTable("job")
            .onDelete("CASCADE");

      });
};

exports.down = async function(knex) {
    await knex.schema.dropTable("event");
    await knex.schema.dropTable("job");
};
