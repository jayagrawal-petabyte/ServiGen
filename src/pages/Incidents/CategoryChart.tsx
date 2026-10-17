import { useState } from "react";
import type { CategoryItem } from "./incidents.data";

type CategoryChartProps = {
  data: CategoryItem[];
};

// Clockwise from 12 o'clock, as in the Halo screenshot
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

function slicePath(start: number, end: number) {
  const p1 = point(start, R);
  const p2 = point(end, R);
  const large = end - start > 180 ? 1 : 0;

  return `M ${CX} ${CY} L ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
}

export default function CategoryChart({
  data,
}: CategoryChartProps) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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

    const text =
      item.showValue === false
        ? item.label
        : `${item.label} (${item.value})`;

    const width = text.length * CHAR_W + PAD * 2;
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

    return { item, style, text, width, edge, stub, start, end, x, y };
  });

  return (
    <section className="incident-card category-card">
      <div className="incident-card-title">
        <div
          style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none" }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand section" : "Collapse section"}
        >
          <h2>Incidents by Category</h2>
          <span className="tickets-heading-arrow">{isCollapsed ? "›" : "⌄"}</span>
        </div>

        <button
          type="button"
          className="chart-action-button"
          aria-label="Open category breakdown report"
          title="Open category breakdown report"
          onClick={() => setShowDetailsModal(true)}
          style={{ cursor: "pointer" }}
        >
          →
        </button>
      </div>

      {!isCollapsed && (
        <svg
          className="halo-cat-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Incidents by category pie chart"
        >
          {slices.map((s) => (
            <path
              key={`slice-${s.item.label}`}
              d={slicePath(s.start, s.end)}
              fill={s.style.fill}
            />
          ))}

          {slices.map((s) => (
            <g key={`label-${s.item.label}`}>
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
                className="halo-cat-label"
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
        </svg>
      )}

      {showDetailsModal && (
        <div
          className="incident-modal-overlay"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="incident-modal"
            style={{ maxWidth: "620px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="incident-modal-close"
              onClick={() => setShowDetailsModal(false)}
              aria-label="Close category details"
            >
              ×
            </button>

            <div className="incident-modal-header" style={{ paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              <h2>Incidents by Category Breakdown</h2>
              <p style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>
                Full distribution across {data.length} IT infrastructure categories ({total} total incidents)
              </p>
            </div>

            <div style={{ flex: 1, overflowY: "auto", margin: "16px 0", paddingRight: "4px" }}>
              <table className="incident-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Incidents</th>
                    <th style={{ textAlign: "right" }}>Share</th>
                    <th style={{ width: "140px" }}>Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item, idx) => {
                    const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                    const style = STYLES[idx % STYLES.length];
                    return (
                      <tr key={item.label} className="incident-row">
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "3px",
                                background: style.fill,
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontSize: "12px", fontWeight: 600 }}>{item.label}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{item.value}</td>
                        <td style={{ textAlign: "right", fontSize: "12px", color: "#64748b" }}>
                          {percent}%
                        </td>
                        <td>
                          <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${percent}%`,
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

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
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