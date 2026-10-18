
import { useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { CategoryItem } from "./incidents.data";

type CategoryChartProps = {
  data: CategoryItem[];
};

type HoveredSlice = {
  label: string;
  value: number;
  color: string;
  x: number;
  y: number;
};

const ORDER = [
  "Network>VPN>Connection Failure",
  "Business Applications>CRM",
  "Hardware>Desktop>Boot Failure",
  "Office Applications>Microsoft Teams>Audio/Video Quality",
  "Outlook>Email Sending/Receiving",
  "Monitor>Display Issues",
  "Wi-Fi>Connectivity",
  "OneDrive>Sync Issues",
  "Security>Phishing>Email Report",
  "Security>Multi-Factor Authentication>Token Lost",
];

const STYLES = [
  { fill: "#003c50", text: "#ffffff" },
  { fill: "#00607c", text: "#ffffff" },
  { fill: "#0096bd", text: "#ffffff" },
  { fill: "#00c6ff", text: "#003040" },
  { fill: "#33d4ff", text: "#003040" },
  { fill: "#80e2ff", text: "#003040" },
  { fill: "#aeeeff", text: "#003040" },
  { fill: "#00516b", text: "#ffffff" },
  { fill: "#007d9d", text: "#ffffff" },
  { fill: "#19afd6", text: "#003040" },
];

const W = 900;
const H = 590;
const CX = 450;
const CY = 290;
const R = 225;
const STUB = 24;
const CHAR_W = 7;
const PAD = 14;
const LABEL_H = 30;

function point(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;

  return {
    x: CX + radius * Math.sin(rad),
    y: CY - radius * Math.cos(rad),
  };
}

function slicePath(start: number, end: number): string {
  const p1 = point(start, R);
  const p2 = point(end, R);
  const large = end - start > 180 ? 1 : 0;

  return [
    `M ${CX} ${CY}`,
    `L ${p1.x} ${p1.y}`,
    `A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y}`,
    "Z",
  ].join(" ");
}

function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatPercentage(value: number, total: number): string {
  if (total <= 0) return "0.0";

  return ((value / total) * 100).toFixed(1);
}

export default function CategoryChart({
  data,
}: CategoryChartProps) {
  const navigate = useNavigate();

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredSlice, setHoveredSlice] =
    useState<HoveredSlice | null>(null);

  // Use backend-provided category names and counts.
  // Do not introduce fixture or hardcoded incident counts.
  const sorted = useMemo(() => {
    const sourceItems = Array.isArray(data) ? data : [];
    const validItems = sourceItems.filter(
      (item) =>
        typeof item.label === "string" &&
        item.label.trim().length > 0 &&
        typeof item.value === "number" &&
        Number.isFinite(item.value) &&
        item.value >= 0
    );

    return [...validItems].sort((a, b) => {
      const ai = ORDER.indexOf(a.label);
      const bi = ORDER.indexOf(b.label);

      // Keep known design categories in their intended order.
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;

      // Unknown categories from the backend remain visible.
      return b.value - a.value || a.label.localeCompare(b.label);
    });
  }, [data]);

  const total = sorted.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const slices = useMemo(() => {
    if (total <= 0) return [];

    const chartItems = sorted.filter((item) => item.value > 0);
    let accumulated = 0;

    return chartItems.map((item, index) => {
      const start = (accumulated / total) * 360;
      accumulated += item.value;
      const end = (accumulated / total) * 360;
      const mid = (start + end) / 2;

      const style = STYLES[index % STYLES.length];

      const text =
        item.showValue === false
          ? item.label
          : `${item.label} (${formatCount(item.value)})`;

      const width = Math.min(
        W - 16,
        Math.max(100, text.length * CHAR_W + PAD * 2)
      );

      const edge = point(mid, R);
      const stub = point(mid, R + STUB);

      let x: number;
      let y: number;

      if (mid > 165 && mid < 195) {
        x = stub.x - width / 2;
        y = stub.y;
      } else if (mid < 180) {
        x = stub.x;
        y = stub.y - LABEL_H / 2;
      } else {
        x = stub.x - width;
        y = stub.y - LABEL_H / 2;
      }

      x = Math.max(4, Math.min(W - 4 - width, x));
      y = Math.max(4, Math.min(H - LABEL_H - 4, y));

      return {
        item,
        style,
        text,
        width,
        edge,
        stub,
        start,
        end,
        x,
        y,
      };
    });
  }, [sorted, total]);

  const handleSliceMouseMove = (
    event: MouseEvent<SVGElement>,
    label: string,
    value: number,
    color: string
  ) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;

    const pointInSvg = svg.createSVGPoint();
    pointInSvg.x = event.clientX;
    pointInSvg.y = event.clientY;

    const matrix = svg.getScreenCTM();
    if (!matrix) return;

    const cursor = pointInSvg.matrixTransform(matrix.inverse());

    setHoveredSlice({
      label,
      value,
      color,
      x: cursor.x,
      y: cursor.y,
    });
  };

  const renderEmptyState = (message: string) => (
    <section className="incident-card category-card">
      <div className="incident-card-title">
        <h2>Incidents by Category</h2>
      </div>

      <div className="incident-empty-state" role="status">
        <h3>No category data</h3>
        <p>{message}</p>
      </div>
    </section>
  );

  if (sorted.length === 0) {
    return renderEmptyState(
      "No incident categories were returned by the backend."
    );
  }

  if (total <= 0) {
    return renderEmptyState(
      "The backend returned no incidents with a positive category count."
    );
  }

  return (
    <section className="incident-card category-card">
      <div className="incident-card-title">
        <button
          type="button"
          className="category-collapse-button"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          aria-expanded={!isCollapsed}
          aria-controls="category-chart-content"
          title={isCollapsed ? "Expand section" : "Collapse section"}
        >
          <h2>Incidents by Category</h2>
          <span className="tickets-heading-arrow" aria-hidden="true">
            {isCollapsed ? "›" : "⌄"}
          </span>
        </button>

        <div className="category-chart-actions">
          <button
            type="button"
            className="chart-action-button"
            aria-label="View category breakdown"
            title="View category breakdown"
            onClick={() => setShowDetailsModal(true)}
          >
            <span aria-hidden="true">▤</span>
          </button>

          <button
            type="button"
            className="chart-action-button"
            aria-label="Open category report"
            title="Open category report"
            onClick={() =>
              navigate("/reports/incidents-by-category")
            }
          >
            <span aria-hidden="true">➔</span>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div id="category-chart-content">
          <svg
            className="sg-cat-svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`Incidents by category pie chart, ${formatCount(total)} total incidents`}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            {slices.map((slice) => {
              const isHovered =
                hoveredSlice?.label === slice.item.label;

              return (
                <path
                  key={`slice-${slice.item.label}`}
                  d={slicePath(slice.start, slice.end)}
                  fill={slice.style.fill}
                  stroke="#ffffff"
                  strokeWidth="1"
                  style={{
                    cursor: "pointer",
                    transition: "opacity 0.15s ease",
                    opacity: hoveredSlice
                      ? isHovered
                        ? 1
                        : 0.88
                      : 1,
                  }}
                  onMouseEnter={(event) =>
                    handleSliceMouseMove(
                      event,
                      slice.item.label,
                      slice.item.value,
                      slice.style.fill
                    )
                  }
                  onMouseMove={(event) =>
                    handleSliceMouseMove(
                      event,
                      slice.item.label,
                      slice.item.value,
                      slice.style.fill
                    )
                  }
                  onClick={() =>
                    navigate("/reports/incidents-by-category")
                  }
                />
              );
            })}

            {slices.map((slice) => (
              <g
                key={`label-${slice.item.label}`}
                style={{ cursor: "pointer" }}
                onMouseEnter={(event) =>
                  handleSliceMouseMove(
                    event,
                    slice.item.label,
                    slice.item.value,
                    slice.style.fill
                  )
                }
                onMouseMove={(event) =>
                  handleSliceMouseMove(
                    event,
                    slice.item.label,
                    slice.item.value,
                    slice.style.fill
                  )
                }
                onClick={() =>
                  navigate("/reports/incidents-by-category")
                }
              >
                <line
                  x1={slice.edge.x}
                  y1={slice.edge.y}
                  x2={slice.stub.x}
                  y2={slice.stub.y}
                  stroke={slice.style.fill}
                  strokeWidth="3"
                />

                <rect
                  x={slice.x}
                  y={slice.y}
                  width={slice.width}
                  height={LABEL_H}
                  rx={LABEL_H / 2}
                  fill={slice.style.fill}
                />

                <text
                  className="sg-cat-label"
                  x={slice.x + slice.width / 2}
                  y={slice.y + LABEL_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  textLength={slice.width - PAD * 2}
                  lengthAdjust="spacingAndGlyphs"
                  fill={slice.style.text}
                >
                  {slice.text}
                </text>
              </g>
            ))}

            {hoveredSlice &&
              (() => {
                const boxWidth = Math.min(
                  W - 20,
                  Math.max(190, hoveredSlice.label.length * 6.5 + 36)
                );
                const boxHeight = 44;

                const placeLeft =
                  hoveredSlice.x > boxWidth + 30;

                const boxX = Math.max(
                  10,
                  Math.min(
                    W - boxWidth - 10,
                    placeLeft
                      ? hoveredSlice.x - boxWidth - 14
                      : hoveredSlice.x + 14
                  )
                );

                const boxY = Math.max(
                  10,
                  Math.min(
                    H - boxHeight - 10,
                    hoveredSlice.y - boxHeight / 2
                  )
                );

                const notchY = Math.max(
                  boxY + 10,
                  Math.min(
                    boxY + boxHeight - 10,
                    hoveredSlice.y
                  )
                );

                const notchPath = placeLeft
                  ? `M ${boxX + boxWidth} ${notchY - 6} L ${Math.min(W - 2, boxX + boxWidth + 8)} ${notchY} L ${boxX + boxWidth} ${notchY + 6} Z`
                  : `M ${boxX} ${notchY - 6} L ${Math.max(2, boxX - 8)} ${notchY} L ${boxX} ${notchY + 6} Z`;

                return (
                  <g key="category-chart-tooltip" style={{ pointerEvents: "none" }}>
                    <rect
                      x={boxX}
                      y={boxY}
                      width={boxWidth}
                      height={boxHeight}
                      rx={4}
                      fill="#0b1b28"
                      stroke="#1b3145"
                      strokeWidth="1"
                    />

                    <path d={notchPath} fill="#0b1b28" />

                    <text
                      x={boxX + 10}
                      y={boxY + 17}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="600"
                      fontFamily="system-ui, sans-serif"
                    >
                      {hoveredSlice.label.length > 32
                        ? `${hoveredSlice.label.slice(0, 29)}...`
                        : hoveredSlice.label}
                    </text>

                    <rect
                      x={boxX + 10}
                      y={boxY + 25}
                      width="10"
                      height="10"
                      fill={hoveredSlice.color}
                      stroke="rgba(255,255,255,0.4)"
                    />

                    <text
                      x={boxX + 26}
                      y={boxY + 34}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="500"
                      fontFamily="system-ui, sans-serif"
                    >
                      {formatCount(hoveredSlice.value)} incidents
                    </text>
                  </g>
                );
              })()}
          </svg>
        </div>
      )}

      {showDetailsModal && (
        <div
          className="incident-modal-overlay"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="incident-modal"
            style={{
              maxWidth: "720px",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-details-heading"
          >
            <button
              type="button"
              className="incident-modal-close"
              onClick={() => setShowDetailsModal(false)}
              aria-label="Close category details"
            >
              ×
            </button>

            <div
              className="incident-modal-header"
              style={{
                paddingBottom: "12px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <h2 id="category-details-heading">
                Incidents by Category Breakdown
              </h2>

              <p
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                {sorted.length} categories · {formatCount(total)} total incidents
              </p>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                margin: "16px 0",
                paddingRight: "4px",
              }}
            >
              <table
                className="incident-table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col" style={{ textAlign: "right" }}>
                      Incidents
                    </th>
                    <th scope="col" style={{ textAlign: "right" }}>
                      Share
                    </th>
                    <th scope="col" style={{ width: "140px" }}>
                      Distribution
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sorted.map((item, index) => {
                    const percent = formatPercentage(
                      item.value,
                      total
                    );
                    const style = STYLES[index % STYLES.length];

                    return (
                      <tr
                        key={item.label}
                        className="incident-row"
                      >
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span
                              style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "3px",
                                background: style.fill,
                                flexShrink: 0,
                              }}
                              aria-hidden="true"
                            />

                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              {item.label}
                            </span>
                          </div>
                        </td>

                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                          }}
                        >
                          {formatCount(item.value)}
                        </td>

                        <td
                          style={{
                            textAlign: "right",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          {percent}%
                        </td>

                        <td>
                          <div
                            style={{
                              width: "100%",
                              height: "8px",
                              background: "#f1f5f9",
                              borderRadius: "4px",
                              overflow: "hidden",
                            }}
                            role="img"
                            aria-label={`${percent}% of incidents`}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, Number(percent))}%`,
                                height: "100%",
                                background: style.fill,
                                borderRadius: "4px",
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                paddingTop: "12px",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <button
                type="button"
                className="new-ticket-button"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
