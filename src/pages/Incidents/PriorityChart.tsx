import React from "react";
import type { ChartItem } from "./incidents.data";

type PriorityChartProps = {
  data: ChartItem[];
};

const AXIS_STEPS = 8;

function getAxisMaximum(highestValue: number): number {
  if (highestValue <= 0) {
    return 10;
  }

  const magnitude = Math.pow(
    10,
    Math.floor(Math.log10(highestValue))
  );

  const normalized = highestValue / magnitude;

  const niceValue =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 5
          ? 5
          : 10;

  return niceValue * magnitude;
}

function getSafeClassName(label: string): string {
  const safeLabel = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeLabel || "unknown";
}

const PriorityChart = React.memo(function PriorityChart({
  data,
}: PriorityChartProps) {
  const validData = Array.isArray(data)
    ? data.filter(
        (item) =>
          typeof item.label === "string" &&
          item.label.trim().length > 0 &&
          typeof item.value === "number" &&
          Number.isFinite(item.value) &&
          item.value >= 0
      )
    : [];

  const highestValue = Math.max(
    0,
    ...validData.map((item) => item.value)
  );

  const maxValue = getAxisMaximum(highestValue);

  const axisValues = Array.from(
    { length: AXIS_STEPS + 1 },
    (_, index) =>
      Math.round(
        (maxValue / AXIS_STEPS) *
          (AXIS_STEPS - index)
      )
  );

  return (
    <section
      className="incident-card priority-card"
      aria-labelledby="priority-chart-heading"
    >
      <div className="incident-card-title">
        <h2 id="priority-chart-heading">
          Incidents by Priority
        </h2>
      </div>

      {validData.length === 0 ? (
        <div
          className="incident-empty-state"
          role="status"
        >
          <p>No priority data available.</p>
        </div>
      ) : (
        <div className="priority-chart">
          <div
            className="priority-axis"
            aria-hidden="true"
          >
            {axisValues.map((value, index) => (
              <span key={`${value}-${index}`}>
                {value}
              </span>
            ))}
          </div>

          <div className="priority-chart-body">
            <div
              className="priority-grid"
              aria-hidden="true"
            >
              {axisValues.slice(1).map((value, index) => (
                <span key={`${value}-${index}`} />
              ))}
            </div>

            <div className="priority-bars">
              {validData.map((item, index) => {
                const height = Math.min(
                  100,
                  (item.value / maxValue) * 100
                );

                const safeClass = getSafeClassName(
                  item.label
                );

                return (
                  <div
                    className="priority-bar-column"
                    key={`${item.label}-${index}`}
                    role="img"
                    aria-label={`${item.label}: ${item.value} incidents`}
                  >
                    <strong className="priority-bar-value">
                      {item.value}
                    </strong>

                    <div className="priority-bar-area">
                      <div
                        className={`priority-bar priority-bar-${safeClass}`}
                        style={{
                          height: `${height}%`,
                        }}
                      />
                    </div>

                    <span className="priority-bar-label">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

export default PriorityChart;