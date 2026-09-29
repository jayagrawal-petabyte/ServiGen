import type { CategoryItem } from "./dashboard.data";

type DashboardCategoryProps = {
  data: CategoryItem[];
};

const COLORS = [
  "#07505a",
  "#0a6670",
  "#0d7d87",
  "#10929e",
  "#11a6b3",
  "#12b3c0",
  "#1bc0cd",
  "#62d3de",
  "#94e0e7",
  "#b5e8ed",
];

type Slice = {
  item: CategoryItem;
  index: number;
  startAngle: number;
  endAngle: number;
  middleAngle: number;
  side: "left" | "right";
};

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
) {
  const radians =
    ((angle - 90) * Math.PI) / 180;

  return {
    x:
      centerX +
      radius * Math.cos(radians),
    y:
      centerY +
      radius * Math.sin(radians),
  };
}

function createArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(
    centerX,
    centerY,
    radius,
    endAngle
  );

  const end = polarToCartesian(
    centerX,
    centerY,
    radius,
    startAngle
  );

  const largeArcFlag =
    endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function formatLabel(item: CategoryItem) {
  return item.displayValue
    ? `${item.label} (${item.value})`
    : item.label;
}

export default function DashboardCategory({
  data,
}: DashboardCategoryProps) {
  if (data.length === 0) {
    return (
      <section className="dashboard-card dashboard-category-card">
        <div className="dashboard-card-header">
          <h2>Incidents by Category</h2>
        </div>

        <div className="dashboard-empty">
          <strong>No category data</strong>
          <span>
            No incident category information is available.
          </span>
        </div>
      </section>
    );
  }

  const total = data.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const centerX = 380;
  const centerY = 200;
  const radius = 125;

  const slices: Slice[] = [];

  let currentAngle = 0;

  data.forEach((item, index) => {
    const startAngle = currentAngle;

    const sliceAngle =
      (item.value / total) * 360;

    const endAngle =
      startAngle + sliceAngle;

    const middleAngle =
      startAngle + sliceAngle / 2;

    const normalizedAngle =
      middleAngle % 360;

    const side =
      normalizedAngle >= 0 &&
      normalizedAngle < 180
        ? "right"
        : "left";

    slices.push({
      item,
      index,
      startAngle,
      endAngle,
      middleAngle,
      side,
    });

    currentAngle = endAngle;
  });

  const leftSlices = slices
    .filter((slice) => slice.side === "left")
    .sort(
      (a, b) =>
        polarToCartesian(
          centerX,
          centerY,
          radius,
          a.middleAngle
        ).y -
        polarToCartesian(
          centerX,
          centerY,
          radius,
          b.middleAngle
        ).y
    );

  const rightSlices = slices
    .filter((slice) => slice.side === "right")
    .sort(
      (a, b) =>
        polarToCartesian(
          centerX,
          centerY,
          radius,
          a.middleAngle
        ).y -
        polarToCartesian(
          centerX,
          centerY,
          radius,
          b.middleAngle
        ).y
    );

  const labelY = [55, 125, 195, 265, 335];

  const leftPositions = new Map<string, number>();

  leftSlices.forEach((slice, index) => {
    leftPositions.set(
      slice.item.label,
      labelY[Math.min(index, labelY.length - 1)]
    );
  });

  const rightPositions = new Map<string, number>();

  rightSlices.forEach((slice, index) => {
    rightPositions.set(
      slice.item.label,
      labelY[Math.min(index, labelY.length - 1)]
    );
  });

  return (
    <section className="dashboard-card dashboard-category-card">
      <div className="dashboard-card-header">
        <h2>Incidents by Category</h2>

        <button
          type="button"
          className="dashboard-round-action"
          aria-label="Open category details"
        >
          →
        </button>
      </div>

      <div className="dashboard-category-chart">
        <svg
          className="dashboard-category-svg"
          viewBox="0 0 760 400"
          preserveAspectRatio="xMidYMid meet"
        >
          {slices.map((slice) => (
            <path
              key={slice.item.label}
              d={createArcPath(
                centerX,
                centerY,
                radius,
                slice.startAngle,
                slice.endAngle
              )}
              fill={
                COLORS[
                  slice.index % COLORS.length
                ]
              }
              stroke="#ffffff"
              strokeWidth="1"
            />
          ))}

          <circle
            cx={centerX}
            cy={centerY}
            r="57"
            fill="#ffffff"
          />

          {leftSlices.map((slice) => {
            const point = polarToCartesian(
              centerX,
              centerY,
              radius + 4,
              slice.middleAngle
            );

            const y =
              leftPositions.get(
                slice.item.label
              ) ?? centerY;

            return (
              <g key={`left-${slice.item.label}`}>
                <path
                  d={`M ${point.x} ${point.y} L 205 ${y} L 170 ${y}`}
                  fill="none"
                  stroke="#c9d5df"
                  strokeWidth="1"
                />

                <circle
                  cx="170"
                  cy={y}
                  r="4"
                  fill={
                    COLORS[
                      slice.index % COLORS.length
                    ]
                  }
                />
              </g>
            );
          })}

          {rightSlices.map((slice) => {
            const point = polarToCartesian(
              centerX,
              centerY,
              radius + 4,
              slice.middleAngle
            );

            const y =
              rightPositions.get(
                slice.item.label
              ) ?? centerY;

            return (
              <g
                key={`right-${slice.item.label}`}
              >
                <path
                  d={`M ${point.x} ${point.y} L 555 ${y} L 590 ${y}`}
                  fill="none"
                  stroke="#c9d5df"
                  strokeWidth="1"
                />

                <circle
                  cx="590"
                  cy={y}
                  r="4"
                  fill={
                    COLORS[
                      slice.index % COLORS.length
                    ]
                  }
                />
              </g>
            );
          })}
        </svg>

        <div className="dashboard-category-labels dashboard-category-labels-left">
          {leftSlices.map((slice) => {
            const y =
              leftPositions.get(
                slice.item.label
              ) ?? 200;

            return (
              <div
                key={slice.item.label}
                className="dashboard-category-label-box"
                style={{
                  top: `${y - 20}px`,
                }}
              >
                {formatLabel(slice.item)}
              </div>
            );
          })}
        </div>

        <div className="dashboard-category-labels dashboard-category-labels-right">
          {rightSlices.map((slice) => {
            const y =
              rightPositions.get(
                slice.item.label
              ) ?? 200;

            return (
              <div
                key={slice.item.label}
                className="dashboard-category-label-box"
                style={{
                  top: `${y - 20}px`,
                }}
              >
                {formatLabel(slice.item)}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}