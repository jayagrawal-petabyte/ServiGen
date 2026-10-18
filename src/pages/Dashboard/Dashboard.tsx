
import { useEffect, useState } from "react";
import "./Dashboard.css";

import MoodCheckIn from "./MoodCheckIn";
import BreachingSLA from "./BreachingSLA";
import OpenIncidentsByTeam from "./OpenIncidentsByTeam";
import DashboardCategory from "./DashboardCategory";
import DashboardTickets from "./DashboardTickets";
import DashboardGreeting from "./DashboardGreeting";

import {
  DASHBOARD_STATS,
  type CategoryItem,
} from "./dashboard.data";

import dashboardService, {
  type DashboardKpis,
} from "../../services/dashboardService";

import { GlobalNavbarActions } from "../../components/shared/GlobalNavbarActions";

type DashboardProps = {
  isLoading?: boolean;
};

function formatResolutionTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return "—";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export default function Dashboard({
  isLoading: parentIsLoading = false,
}: DashboardProps) {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const [isKpisLoading, setIsKpisLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  const [kpisError, setKpisError] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadKpis() {
      setIsKpisLoading(true);
      setKpisError(false);

      try {
        const data = await dashboardService.getKpis();

        if (!mounted) return;

        if (data) {
          setKpis(data);
        } else {
          setKpis(null);
          setKpisError(true);
        }
      } catch (error) {
        console.error("Failed to load dashboard KPIs:", error);

        if (mounted) {
          setKpis(null);
          setKpisError(true);
        }
      } finally {
        if (mounted) {
          setIsKpisLoading(false);
        }
      }
    }

    async function loadCategories() {
      setIsCategoriesLoading(true);
      setCategoriesError(false);

      try {
        const data =
          await dashboardService.getIncidentsByCategory();

        if (!mounted) return;

        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
          setCategoriesError(true);
        }
      } catch (error) {
        console.error("Failed to load dashboard categories:", error);

        if (mounted) {
          setCategories([]);
          setCategoriesError(true);
        }
      } finally {
        if (mounted) {
          setIsCategoriesLoading(false);
        }
      }
    }

    void loadKpis();
    void loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  const dashboardIsLoading =
    parentIsLoading || isKpisLoading || isCategoriesLoading;

  // Keep the existing card labels and styling, but never use
  // fixture values as fallback metric values.
  const stats = DASHBOARD_STATS.map((stat) => {
    if (stat.label === "Open Incidents") {
      return {
        ...stat,
        value: kpisError || !kpis
          ? "—"
          : String(kpis.openIncidents),
      };
    }

    if (stat.label === "Average Resolution Time") {
      const resolutionTime =
        kpis?.avgResolutionTimeFormatted ??
        (typeof kpis?.avgResolutionTimeMinutes === "number"
          ? formatResolutionTime(kpis.avgResolutionTimeMinutes)
          : null);

      return {
        ...stat,
        value: kpisError || !resolutionTime
          ? "—"
          : resolutionTime,
      };
    }

    // These metrics are not reliably provided by the known
    // dashboard KPI response. Do not display fixture numbers.
    return {
      ...stat,
      value: "—",
    };
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
            {stats.map((stat) => {
              const isSupportedMetric =
                stat.label === "Open Incidents" ||
                stat.label === "Average Resolution Time";

              const isMetricLoading =
                isKpisLoading && isSupportedMetric;

              return (
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

                  <strong aria-live="polite">
                    {isMetricLoading ? "..." : stat.value}
                  </strong>
                </article>
              );
            })}
          </div>

          <BreachingSLA isLoading={dashboardIsLoading} />

          <OpenIncidentsByTeam />
        </section>

        <section className="dashboard-lower-grid">
          {categoriesError ? (
            <section className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Incidents by Category</h2>
              </div>

              <div className="dashboard-empty" role="status">
                <strong>Unable to load categories</strong>
                <span>Please try again later.</span>
              </div>
            </section>
          ) : isCategoriesLoading ? (
            <section className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Incidents by Category</h2>
              </div>

              <div className="dashboard-empty" role="status">
                <span>Loading category data...</span>
              </div>
            </section>
          ) : categories.length === 0 ? (
            <section className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Incidents by Category</h2>
              </div>

              <div className="dashboard-empty" role="status">
                <strong>No category data available</strong>
                <span>
                  The backend returned no category records.
                </span>
              </div>
            </section>
          ) : (
            <DashboardCategory data={categories} />
          )}

          <DashboardTickets isLoading={dashboardIsLoading} />
        </section>
      </main>
    </div>
  );
}
