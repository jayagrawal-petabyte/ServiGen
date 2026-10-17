import { useState, useEffect } from "react";
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
  type CategoryItem,
} from "./dashboard.data";
import dashboardService, { DashboardKpis } from "../../services/dashboardService";
import { GlobalNavbarActions } from "../../components/shared/GlobalNavbarActions";

type DashboardProps = {
  isLoading?: boolean;
};

export default function Dashboard({
  isLoading = false,
}: DashboardProps) {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>(CATEGORY_DATA);

  useEffect(() => {
    let mounted = true;
    dashboardService.getKpis().then((data) => {
      if (mounted && data) {
        setKpis(data);
      }
    });
    dashboardService.getIncidentsByCategory().then((data) => {
      if (mounted && data?.length) {
        setCategories(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const stats = DASHBOARD_STATS.map((stat) => {
    if (!kpis) return stat;
    if (stat.label === "Open Incidents") {
      return { ...stat, value: String(kpis.openIncidents) };
    }
    if (stat.label === "Average Resolution Time") {
      const hours = (kpis.avgResolutionTimeMinutes / 60).toFixed(2);
      return { ...stat, value: hours };
    }
    return stat;
  });

  return (
    <div className="dashboard-layout">
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Halo AI Service Desk • ITSM Portal
          </span>
        </div>
        <GlobalNavbarActions />
      </header>
      <main className="dashboard-page">
        <DashboardGreeting />

        <MoodCheckIn />

        <section className="dashboard-main-grid">
          <div className="dashboard-stats-grid">
            {stats.map((stat) => (
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
          <DashboardCategory data={categories} />

          <DashboardTickets isLoading={isLoading} />
        </section>
      </main>
    </div>
  );
}