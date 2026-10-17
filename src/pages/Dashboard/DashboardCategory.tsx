import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CategoryItem } from "./dashboard.data";

type DashboardCategoryProps = {
  data: CategoryItem[];
};

// Clockwise order from 12 o'clock, as in the Halo screenshot
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

export default function DashboardCategory({
  data,
}: DashboardCategoryProps) {
  const navigate = useNavigate();
  const [hoveredSlice, setHoveredSlice] = useState<{
    label: string;
    value: number;
    color: string;
    x: number;
    y: number;
  } | null>(null);

  const handleSliceMouseMove = (
    e: React.MouseEvent<SVGElement>,
    label: string,
    value: number,
    color: string
  ) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const cursor = pt.matrixTransform(ctm.inverse());
    setHoveredSlice({
      label,
      value,
      color,
      x: cursor.x,
      y: cursor.y,
    });
  };

  if (data.length === 0) {
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

  const sorted = [...data].sort((a, b) => {
    const ai = ORDER.indexOf(a.label);
    const bi = ORDER.indexOf(b.label);

    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const total = sorted.reduce((sum, item) => sum + item.value, 0);

  let acc = 0;

  const slices = sorted.map((item, index) => {
    const start = (acc / total) * 360;
    acc += item.value;
    const end = (acc / total) * 360;
    const mid = (start + end) / 2;

    const style = STYLES[index % STYLES.length];

    const text = item.displayValue
      ? `${item.label} (${item.value})`
      : item.label;

    const width = text.length * CHAR_W + PAD * 2;
    const edge = point(mid, R);
    const stub = point(mid, R + STUB);

    let x: number;
    let y: number;

    if (mid > 165 && mid < 195) {
      // bottom: centre the label under the slice
      x = stub.x - width / 2;
      y = stub.y;
    } else if (mid < 180) {
      // right side
      x = stub.x;
      y = stub.y - LABEL_H / 2;
    } else {
      // left side
      x = stub.x - width;
      y = stub.y - LABEL_H / 2;
    }

    x = Math.max(4, Math.min(W - 4 - width, x));

    return { item, style, text, width, edge, stub, start, end, x, y };
  });

  return (
    <section className="dashboard-card dashboard-category-card">
      <div className="dashboard-card-header">
        <h2>Incidents by Category</h2>

        <button
          type="button"
          className="dashboard-round-action"
          aria-label="Open Incidents by Category report"
          onClick={() => navigate('/reports/incidents-by-category')}
          title="Open Incidents by Category report"
          style={{ cursor: 'pointer' }}
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
          {slices.map((s) => {
            const isHovered = hoveredSlice?.label === s.item.label;
            return (
              <path
                key={`slice-${s.item.label}`}
                d={slicePath(s.start, s.end)}
                fill={s.style.fill}
                style={{
                  cursor: "pointer",
                  transition: "opacity 0.15s ease",
                  opacity: hoveredSlice ? (isHovered ? 1 : 0.88) : 1,
                }}
                onMouseEnter={(e) => handleSliceMouseMove(e, s.item.label, s.item.value, s.style.fill)}
                onMouseMove={(e) => handleSliceMouseMove(e, s.item.label, s.item.value, s.style.fill)}
                onClick={() => navigate('/reports/incidents-by-category')}
              />
            );
          })}

          {slices.map((s) => (
            <g
              key={`label-${s.item.label}`}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => handleSliceMouseMove(e, s.item.label, s.item.value, s.style.fill)}
              onMouseMove={(e) => handleSliceMouseMove(e, s.item.label, s.item.value, s.style.fill)}
              onClick={() => navigate('/reports/incidents-by-category')}
            >
              <line
                x1={s.edge.x}
                y1={s.edge.y}
                x2={s.stub.x}
                y2={s.stub.y}
                stroke={s.style.fill}
                strokeWidth="4"
              />

              <rect
                x={s.x}
                y={s.y}
                width={s.width}
                height={LABEL_H}
                rx={LABEL_H / 2}
                fill={s.style.fill}
              />

              <text
                className="dashboard-category-label"
                x={s.x + s.width / 2}
                y={s.y + LABEL_H / 2}
                textAnchor="middle"
                dominantBaseline="central"
                textLength={s.width - PAD * 2}
                lengthAdjust="spacingAndGlyphs"
                fill={s.style.text}
              >
                {s.text}
              </text>
            </g>
          ))}

          {/* Slice hover tooltip matching Image 1 */}
          {hoveredSlice && (() => {
            const textLen = hoveredSlice.label.length;
            const boxWidth = Math.max(190, textLen * 6.5 + 24);
            const boxHeight = 44;
            const placeLeft = hoveredSlice.x > boxWidth + 30;
            const boxX = placeLeft ? hoveredSlice.x - boxWidth - 14 : hoveredSlice.x + 14;
            const boxY = Math.max(10, Math.min(H - boxHeight - 10, hoveredSlice.y - boxHeight / 2));
            const notchY = Math.max(boxY + 10, Math.min(boxY + boxHeight - 10, hoveredSlice.y));

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

                {/* Line 1: Category Name */}
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

                {/* Line 2: Color square swatch + count */}
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