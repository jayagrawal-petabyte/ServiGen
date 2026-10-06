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
        <h2>Incidents by Category</h2>

        <button
          type="button"
          className="chart-action-button"
          aria-label="Open category chart"
        >
          →
        </button>
      </div>

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
    </section>
  );
}