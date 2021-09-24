import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "@royalnavy/css-framework/dist/styles.css";
import "@royalnavy/fonts";
import {
  Timeline,
  TimelineTodayMarker,
  TimelineMonths,
  TimelineWeeks,
  TimelineDays,
  TimelineRows,
  TimelineRow,
  TimelineEvents,
  TimelineEvent,
  DatePicker,
  Modal,
} from "@royalnavy/react-component-library";
import logo from "./logo.svg";
import "./App.css";
import { css } from "styled-components";
import { endOfDay, startOfDay } from "date-fns";

function buildUrl(path) {
  return `${process.env.REACT_APP_API_URL}${path}`;
}
const rowCss = css`
  height: 100px;
`;
const rowContentProps = {
  css: css`
    border-bottom: 1px solid;
  `,
};
const rowHeaderProps = {
  css: css`
    background-color: lightgrey;
    border-bottom: 1px solid;
  `,
};

const CustomEvent = ({
  children,
  startDate,
  endDate,
  widthPx,
  offsetPx,
  row,
  ...rest
}) => {
  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: "lightgrey",
        color: "black",
        marginLeft: offsetPx,
        width: widthPx,
        transform: `translateY(${22 * row}px)`,
        border: "1px solid",
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

function App() {
  const [data, setData] = useState([]);
  const [modal, setDataModal] = useState(null);
  const [range, setRange] = useState({});

  const [_, forceUpdateSate] = useState({});

  function forceUpdate() {
    forceUpdateSate({});
  }

  useEffect(() => {
    const rangeParam = new URLSearchParams({
      start_date: new Date("2021-01-01").toISOString(),
      end_date: new Date("2021-06-01").toISOString(),
    });
    fetch(buildUrl(`/job/item?${rangeParam.toString()}`))
      .then((data) => data.json())
      .then(setData);
  }, [_]);

  useEffect(() => {
    if (modal) {
      setDateRange({
        startDate: new Date(modal.start),
        endDate: new Date(modal.end),
      });
    }
  }, [modal]);

  function setDateRange(date) {
    setRange((prev) => ({
      ...prev,
      ...date,
    }));
  }

  function remoteUpdate(modal) {
    fetch(buildUrl(`/item/${modal.id}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start: new Date(range.startDate).toISOString(),
        end: new Date(range.endDate).toISOString(),
        job: modal.job,
        description: modal.description,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        forceUpdate(_);
        setDataModal(null);
      })
      .catch((error) => console.log("error", error));
  }

  function remoteDelete(modal) {
    fetch(buildUrl(`/item/${modal.id}`), {
      method: "Delete",
    })
      .then((response) => response.json())
      .then((result) => {
        forceUpdate(_);
        setDataModal(null);
      })
      .catch((error) => console.log("error", error));
  }

  return (
    <div>
      <Modal
        primaryButton={{
          children: "Save",
          onClick: () => remoteUpdate(modal),
        }}
        secondaryButton={{
          children: "Close",
          onClick: () => setDataModal(null),
        }}
        tertiaryButton={{
          children: "Delete",
          onClick: () => remoteDelete(modal),
        }}
        isOpen={modal !== null}
      >
        {modal && (
          <>
            <DatePicker
              startDate={new Date(modal.start)}
              onChange={({ startDate }) =>
                setDateRange({ startDate: startOfDay(startDate) })
              }
            />
            <DatePicker
              startDate={new Date(modal.end)}
              onChange={({ startDate }) =>
                setDateRange({ endDate: endOfDay(startDate) })
              }
            />
          </>
        )}
        <pre
          style={{
            fontFamily: "Courier",
            background: " #f4f4f4",
            border: "solid 1px #e1e1e1",
            float: "left",
            width: "auto",
          }}
        >
          {JSON.stringify(modal, null, " ").replace("[", "").replace("]", "")}
        </pre>
      </Modal>
      <Timeline
        hasSide
        startDate={new Date("2021-01-01")}
        endDate={new Date("2021-06-01")}
      >
        <TimelineTodayMarker />
        <TimelineMonths />
        <TimelineWeeks />
        <TimelineDays />
        <TimelineRows>
          {data.map((dataRow) => {
            return (
              <TimelineRow
                key={dataRow.id}
                name={dataRow.name}
                css={rowCss}
                contentProps={rowContentProps}
                headerProps={rowHeaderProps}
              >
                <TimelineEvents>
                  {dataRow.events.map((event, i) => (
                    <TimelineEvent
                      key={event.id}
                      startDate={new Date(event.start)}
                      endDate={new Date(event.end)}
                      render={(startDate, endDate, widthPx, offsetPx) => {
                        return (
                          <CustomEvent
                            onClick={() => setDataModal(event)}
                            startDate={startDate}
                            endDate={endDate}
                            widthPx={widthPx}
                            offsetPx={offsetPx}
                            row={event.row}
                          >
                            {event.description}
                          </CustomEvent>
                        );
                      }}
                    />
                  ))}
                </TimelineEvents>
              </TimelineRow>
            );
          })}
        </TimelineRows>
      </Timeline>
    </div>
  );
}

export default App;
