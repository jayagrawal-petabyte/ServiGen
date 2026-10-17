import type { ChartItem } from "./incidents.data";

type PriorityChartProps = {
  data: ChartItem[];
};

export default function PriorityChart({
  data,
}: PriorityChartProps) {
  const maxValue = 80;

  return (
    <section className="incident-card priority-card">
      <div className="incident-card-title">
        <h2>Incidents by Priority</h2>
      </div>

      {data.length === 0 ? (
        <div className="incident-empty-state">
          <p>No priority data available.</p>
        </div>
      ) : (
        <div className="priority-chart">
          <div className="priority-axis">
            <span>80</span>
            <span>70</span>
            <span>60</span>
            <span>50</span>
            <span>40</span>
            <span>30</span>
            <span>20</span>
            <span>10</span>
            <span>0</span>
          </div>

          <div className="priority-chart-body">
            <div className="priority-grid">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="priority-bars">
              {data.map((item) => {
                const height =
                  (item.value / maxValue) * 100;

                return (
                  <div
                    className="priority-bar-column"
                    key={item.label}
                  >
                    <strong className="priority-bar-value">
                      {item.value}
                    </strong>

                    <div className="priority-bar-area">
                      <div
                        className={`priority-bar priority-bar-${item.label.toLowerCase()}`}
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
}