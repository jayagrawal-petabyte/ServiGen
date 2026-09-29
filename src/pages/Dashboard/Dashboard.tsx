import "./Dashboard.css";

import MoodCheckIn from "./MoodCheckIn";
import BreachingSLA from "./BreachingSLA";
import OpenIncidentsByTeam from "./OpenIncidentsByTeam";
import DashboardCategory from "./DashboardCategory";
import DashboardTickets from "./DashboardTickets";
import DashboardGreeting from "./DashboardGreeting";

import {
  CATEGORY_DATA,
  DASHBOARD_STATS,
} from "./dashboard.data";

type DashboardProps = {
  isLoading?: boolean;
};

export default function Dashboard({
  isLoading = false,
}: DashboardProps) {
  return (
    <main className="dashboard-page">
      <DashboardGreeting />

      <MoodCheckIn />

      <section className="dashboard-main-grid">
        <div className="dashboard-stats-grid">
          {DASHBOARD_STATS.map((stat) => (
            <article
              key={stat.label}
              className={`dashboard-stat-card dashboard-stat-${stat.type}`}
            >
              <h2>
                {stat.label}
                {"suffix" in stat && (
                  <span> ({stat.suffix})</span>
                )}
              </h2>

              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>

        <BreachingSLA isLoading={isLoading} />

        <OpenIncidentsByTeam />
      </section>

      <section className="dashboard-lower-grid">
        <DashboardCategory data={CATEGORY_DATA} />

        <DashboardTickets isLoading={isLoading} />
      </section>
    </main>
  );
}