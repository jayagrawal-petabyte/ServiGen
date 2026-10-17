import { DASHBOARD_STATS } from "./incidents.data";

export default function StatisticsCards() {
  return (
    <section className="incident-statistics">
      {DASHBOARD_STATS.map((stat) => (
        <article
          key={stat.label}
          className={`incident-stat-card stat-${stat.variant}`}
        >
          <div className="incident-stat-header">
            <span>{stat.label}</span>
            <span className="incident-stat-dot" />
          </div>

          <strong className="incident-stat-value">
            {stat.value}
          </strong>

          <p className="incident-stat-description">
            {stat.description}
          </p>
        </article>
      ))}
    </section>
  );
}