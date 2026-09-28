import type { ChartItem } from "./incidents.data";

type CategoryChartProps = {
  data: ChartItem[];
};

const CATEGORY_COLORS = [
  "#263F67",
  "#F3A384",
  "#6EA7D9",
  "#F6C6B4",
];

export default function CategoryChart({
  data,
}: CategoryChartProps) {
  const total = data.reduce(
    (sum, item) => sum + item.value,
    0
  );

  let currentAngle = 0;

  const segments = data.map((item, index) => {
    const angle =
      total > 0
        ? (item.value / total) * 360
        : 0;

    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    currentAngle = endAngle;

    return {
      ...item,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      startAngle,
      endAngle,
    };
  });

  const gradient =
    segments.length > 0
      ? `conic-gradient(${segments
          .map(
            (segment) =>
              `${segment.color} ${segment.startAngle}deg ${segment.endAngle}deg`
          )
          .join(", ")})`
      : "#edf0f4";

  return (
    <section className="incident-card category-card">
      <div className="incident-card-title">
        <h2>Incidents by Category</h2>
      </div>

      {data.length === 0 ? (
        <div className="incident-empty-state">
          <p>No category data available.</p>
        </div>
      ) : (
        <div className="category-chart">
          <div
            className="category-donut"
            style={{
              background: gradient,
            }}
          >
            <div className="category-donut-center" />
          </div>

          <div className="category-legend">
            {segments.map((item) => {
              const percentage =
                total > 0
                  ? Math.round(
                      (item.value / total) * 100
                    )
                  : 0;

              return (
                <div
                  className="category-legend-row"
                  key={item.label}
                >
                  <div className="category-legend-name">
                    <span
                      className="category-legend-dot"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />

                    <span>{item.label}</span>
                  </div>

                  <strong>{item.value}</strong>

                  <span className="category-percentage">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}