
import { useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { CategoryItem } from "./dashboard.data";

type DashboardCategoryProps = {
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
  { fill: "#00c6ff", text: "#ffffff" },
  { fill: "#33d4ff", text: "#003040" },
  { fill: "#80e2ff", text: "#003040" },
  { fill: "#aeeeff", text: "#003040" },
  { fill: "#003c50", text: "#ffffff" },
  { fill: "#00607c", text: "#ffffff" },
  { fill: "#0096bd", text: "#ffffff" },
];

const W = 900;
const H = 560;
const CX = 450;
const CY = 300;
const R = 190;
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

function slicePath(start: number, end: number) {
  const p1 = point(start, R);
  const p2 = point(end, R);
  const large = end - start > 180 ? 1 : 0;

  return `M ${CX} ${CY} L ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
}

function EmptyCategoryState() {
  return (
    <section className="dashboard-card dashboard-category-card">
      <div className="dashboard-card-header">
        <h2>Incidents by Category</h2>
      </div>

      <div className="dashboard-empty">
        <strong>No category data</strong>
        <span>No incident category information is available.</span>
      </div>
    </section>
  );
}

export default function DashboardCategory({
  data,
}: DashboardCategoryProps) {
  const navigate = useNavigate();

  const [hoveredSlice, setHoveredSlice] =
    useState<HoveredSlice | null>(null);

  const handleSliceMouseMove = (
    event: MouseEvent<SVGElement>,
    label: string,
    value: number,
    color: string
  ) => {
    const svg = event.currentTarget.ownerSVGElement;

    if (!svg) return;

    const pointOnScreen = svg.createSVGPoint();
    pointOnScreen.x = event.clientX;
    pointOnScreen.y = event.clientY;

    const matrix = svg.getScreenCTM();

    if (!matrix) return;

    const cursor = pointOnScreen.matrixTransform(matrix.inverse());

    setHoveredSlice({
      label,
      value,
      color,
      x: cursor.x,
      y: cursor.y,
    });
  };

  const validData = Array.isArray(data)
    ? data.filter(
        (item) =>
          item &&
          typeof item.label === "string" &&
          item.label.trim().length > 0 &&
          Number.isFinite(item.value) &&
          item.value > 0
      )
    : [];

  if (validData.length === 0) {
    return <EmptyCategoryState />;
  }

  const sorted = [...validData].sort((a, b) => {
    const ai = ORDER.indexOf(a.label);
    const bi = ORDER.indexOf(b.label);

    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const total = sorted.reduce((sum, item) => sum + item.value, 0);

  if (!Number.isFinite(total) || total <= 0) {
    return <EmptyCategoryState />;
  }

  let accumulated = 0;

  const slices = sorted.map((item, index) => {
    const start = (accumulated / total) * 360;

    accumulated += item.value;

    const end = (accumulated / total) * 360;
    const mid = (start + end) / 2;
    const style = STYLES[index % STYLES.length];

    const text = item.displayValue
      ? `${item.label} (${item.value})`
      : item.label;

    const width = Math.max(70, text.length * CHAR_W + PAD * 2);
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

  const openCategoryReport = () => {
    navigate("/reports/incidents-by-category");
  };

  return (
    <section className="dashboard-card dashboard-category-card">
      <div className="dashboard-card-header">
        <h2>Incidents by Category</h2>

        <button
          type="button"
          className="dashboard-round-action"
          aria-label="Open Incidents by Category report"
          onClick={openCategoryReport}
          title="Open Incidents by Category report"
          style={{ cursor: "pointer" }}
        >
          <span
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              backgroundColor: "#2c3b4d",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              lineHeight: 1,
            }}
          >
            ➔
          </span>
        </button>
      </div>

      <div className="dashboard-category-visual">
        <svg
          className="dashboard-category-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Incidents by category pie chart"
          onMouseLeave={() => setHoveredSlice(null)}
          style={{ cursor: "pointer" }}
        >
          {slices.map((slice) => {
            const isHovered = hoveredSlice?.label === slice.item.label;

            return (
              <path
                key={`slice-${slice.item.label}`}
                d={slicePath(slice.start, slice.end)}
                fill={slice.style.fill}
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
                onClick={openCategoryReport}
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
              onClick={openCategoryReport}
            >
              <line
                x1={slice.edge.x}
                y1={slice.edge.y}
                x2={slice.stub.x}
                y2={slice.stub.y}
                stroke={slice.style.fill}
                strokeWidth="4"
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
                className="dashboard-category-label"
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
              const textLength = hoveredSlice.label.length;
              const boxWidth = Math.min(
                W - 20,
                Math.max(190, textLength * 6.5 + 24)
              );
              const boxHeight = 44;

              const placeLeft = hoveredSlice.x > W / 2;
              const desiredX = placeLeft
                ? hoveredSlice.x - boxWidth - 14
                : hoveredSlice.x + 14;

              const boxX = Math.max(
                10,
                Math.min(W - boxWidth - 10, desiredX)
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
                Math.min(boxY + boxHeight - 10, hoveredSlice.y)
              );

              const notchPath = placeLeft
                ? `M ${boxX + boxWidth} ${notchY - 6} L ${boxX + boxWidth + 8} ${notchY} L ${boxX + boxWidth} ${notchY + 6} Z`
                : `M ${boxX} ${notchY - 6} L ${boxX - 8} ${notchY} L ${boxX} ${notchY + 6} Z`;

              return (
                <g style={{ pointerEvents: "none" }}>
                  <rect
                    x={boxX}
                    y={boxY}
                    width={boxWidth}
                    height={boxHeight}
                    rx={4}
                    ry={4}
                    fill="#0b1b28"
                    stroke="#1b3145"
                    strokeWidth="1"
                  />

                  <path d={notchPath} fill="#0b1b28" />

                  <text
                    x={boxX + 10}
                    y={boxY + 17}
                    fill="#ffffff"
                    fontSize="12.5"
                    fontWeight="600"
                    fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                  >
                    {hoveredSlice.label}
                  </text>

                  <rect
                    x={boxX + 10}
                    y={boxY + 25}
                    width="10"
                    height="10"
                    fill={hoveredSlice.color}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1"
                  />

                  <text
                    x={boxX + 26}
                    y={boxY + 34}
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="500"
                    fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                  >
                    {hoveredSlice.value}
                  </text>
                </g>
              );
            })()}
        </svg>
      </div>
    </section>
  );
}
