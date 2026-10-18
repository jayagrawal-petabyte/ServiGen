
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

import MoodCheckIn from "./MoodCheckIn";
import BreachingSLA from "./BreachingSLA";
import OpenIncidentsByTeam from "./OpenIncidentsByTeam";
import DashboardCategory from "./DashboardCategory";
import DashboardTickets from "./DashboardTickets";
import DashboardGreeting from "./DashboardGreeting";

import {
  type CategoryItem,
} from "./dashboard.data";

import dashboardService, {
  type DashboardKpis,
  type DashboardSummary,
} from "../../services/dashboardService";
import { majorIncidentsService } from "../../services/majorIncidentsService";

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
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [majorIncidentsCount, setMajorIncidentsCount] = useState<number>(4);

  const [isKpisLoading, setIsKpisLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  const [kpisError, setKpisError] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadMajorIncidents() {
      try {
        const live = await majorIncidentsService.getMajorIncidents();
        if (mounted) {
          setMajorIncidentsCount(Array.isArray(live) ? live.length : 0);
        }
      } catch {
        if (mounted) {
          setMajorIncidentsCount(0);
        }
      }
    }
    void loadMajorIncidents();

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

        const sum = await dashboardService.getSummary();
        if (mounted && sum) {
          setSummary(sum);
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

  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const resolutionTime =
    kpis?.avgResolutionTimeFormatted ??
    (typeof kpis?.avgResolutionTimeMinutes === "number"
      ? formatResolutionTime(kpis.avgResolutionTimeMinutes)
      : null);

  const stats = [
    {
      label: "Open Incidents",
      value: kpisError || !kpis ? "—" : String(kpis.openIncidents),
      type: "open",
    },
    {
      label: "Resolved Incidents",
      value:
        kpis?.resolvedIncidents != null
          ? String(kpis.resolvedIncidents)
          : summary?.tickets?.actioned != null
          ? String(summary.tickets.actioned)
          : "—",
      type: "resolved",
    },
    {
      label: "Major Incidents",
      value:
        kpis?.majorIncidents != null
          ? String(kpis.majorIncidents)
          : String(majorIncidentsCount),
      type: "major",
    },
    {
      label: "Unassigned Incidents",
      value:
        kpis?.unassignedIncidents != null
          ? String(kpis.unassignedIncidents)
          : summary?.assignments?.total != null
          ? String(summary.assignments.total)
          : summary?.tickets?.pending != null
          ? String(summary.tickets.pending)
          : "—",
      type: "unassigned",
    },
    {
      label: "Average Response Time",
      value: kpis?.avgResponseTimeHours || "2.4",
      suffix: "Hrs",
      type: "response",
    },
    {
      label: "Average Resolution Time",
      value: kpisError || !resolutionTime ? "—" : resolutionTime,
      suffix: "Hrs",
      type: "resolution",
    },
  ];

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
              const isMetricLoading = isKpisLoading;
              const isMajorIncident = stat.label === "Major Incidents";

              return (
                <article
                  key={stat.label}
                  className={`dashboard-stat-card dashboard-stat-${stat.type}`}
                  onClick={isMajorIncident ? () => navigate("/major-incidents/live") : undefined}
                  style={isMajorIncident ? { cursor: "pointer" } : undefined}
                  title={isMajorIncident ? "Open Major Incidents Live Console" : undefined}
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
