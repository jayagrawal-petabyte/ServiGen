import type { CategoryItem } from "./incidents.data";

type CategoryChartProps = {
  data: CategoryItem[];
};

const CATEGORY_COLORS = [
  "#084f58",
  "#0b6670",
  "#0d7d87",
  "#10929e",
  "#11a5b2",
  "#12b2bf",
  "#18bfcd",
  "#62d2dd",
  "#8edfe7",
  "#afe8ee",
];

function formatCategoryLabel(item: CategoryItem): string {
  return item.showValue === false
    ? item.label
    : `${item.label} (${item.value})`;
}

export default function CategoryChart({
  data,
}: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <section className="incident-card category-card">
        <div className="incident-card-title">
          <h2>Incidents by Category</h2>
        </div>

        <div className="incident-empty-state">
          <h3>No category data</h3>
          <p>No incident categories are available.</p>
        </div>
      </section>
    );
  }

  const total = data.reduce(
    (sum, item) => sum + item.value,
    0
  );

  let current = 0;

  const gradient = data
    .map((item, index) => {
      const start = (current / total) * 100;

      current += item.value;

      const end = (current / total) * 100;

      return `${
        CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      } ${start}% ${end}%`;
    })
    .join(", ");

  const leftItems = data.slice(0, 5);
  const rightItems = data.slice(5, 10);

  return (
    <section className="incident-card category-card">
      <div className="incident-card-title">
        <h2>Incidents by Category</h2>

        <button
          type="button"
          className="chart-action-button"
          aria-label="Open category chart"
        >
          →
        </button>
      </div>

      <div className="category-chart-layout">
        <div className="category-label-column category-label-left">
          {leftItems.map((item, index) => (
            <div
              key={item.label}
              className="category-callout category-callout-left"
            >
              <span
                className="category-callout-dot"
                style={{
                  background:
                    CATEGORY_COLORS[
                      index % CATEGORY_COLORS.length
                    ],
                }}
              />

              <span className="category-callout-text">
                {formatCategoryLabel(item)}
              </span>
            </div>
          ))}
        </div>

        <div className="category-pie-wrapper">
          <div
            className="category-pie"
            style={{
              background: `conic-gradient(${gradient})`,
            }}
          >
            <div className="category-pie-hole" />
          </div>
        </div>

        <div className="category-label-column category-label-right">
          {rightItems.map((item, index) => (
            <div
              key={item.label}
              className="category-callout category-callout-right"
            >
              <span className="category-callout-text">
                {formatCategoryLabel(item)}
              </span>

              <span
                className="category-callout-dot"
                style={{
                  background:
                    CATEGORY_COLORS[
                      (index + 5) %
                        CATEGORY_COLORS.length
                    ],
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}