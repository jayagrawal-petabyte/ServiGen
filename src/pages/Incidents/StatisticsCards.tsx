
export type Statistic = {
  label: string;
  value: string | number;
  description: string;
  variant: string;
};

type StatisticsCardsProps = {
  stats: Statistic[];
  isLoading?: boolean;
};

export default function StatisticsCards({
  stats,
  isLoading = false,
}: StatisticsCardsProps) {
  return (
    <section className="incident-statistics" aria-label="Incident statistics">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className={`incident-stat-card stat-${stat.variant}`}
        >
          <div className="incident-stat-header">
            <span>{stat.label}</span>
            <span className="incident-stat-dot" aria-hidden="true" />
          </div>

          <strong
            className="incident-stat-value"
            aria-live="polite"
          >
            {isLoading ? "…" : stat.value}
          </strong>

          <p className="incident-stat-description">
            {isLoading ? "Loading data..." : stat.description}
          </p>
        </article>
      ))}
    </section>
  );
}
