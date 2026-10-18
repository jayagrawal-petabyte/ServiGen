
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/apiClient";

type TeamIncident = {
  label: string;
  value: number;
};

type ApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseTeamData(response: unknown): TeamIncident[] {
  if (!isRecord(response)) {
    throw new Error("Invalid response from the dashboard API.");
  }

  const envelope = response as ApiEnvelope;

  if (envelope.success === false) {
    throw new Error(
      envelope.message || "Failed to load incidents by team."
    );
  }

  const payload = envelope.data;
  let rows: unknown;

  if (Array.isArray(payload)) {
    rows = payload;
  } else if (isRecord(payload) && Array.isArray(payload.teams)) {
    rows = payload.teams;
  } else if (isRecord(payload) && Array.isArray(payload.data)) {
    rows = payload.data;
  }

  if (!Array.isArray(rows)) {
    throw new Error(
      "The dashboard API response does not contain team data."
    );
  }

  const parsed: TeamIncident[] = [];

  for (const item of rows) {
    if (!isRecord(item)) continue;

    const label =
      typeof item.label === "string" && item.label.trim()
        ? item.label.trim()
        : typeof item.team === "string" && item.team.trim()
        ? item.team.trim()
        : null;

    const rawValue = item.value ?? item.openIncidents;
    const value = typeof rawValue === "number" && Number.isFinite(rawValue) && rawValue >= 0 ? rawValue : 0;

    if (label) {
      parsed.push({
        label,
        value,
      });
    }
  }

  return parsed;
}

export default function OpenIncidentsByTeam() {
  const navigate = useNavigate();

  const [teamData, setTeamData] = useState<TeamIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadTeamData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<unknown>(
          "/api/dashboard/incidents-by-team"
        );

        const data = parseTeamData(response);

        if (mounted) {
          setTeamData(data);
        }
      } catch (err: unknown) {
        console.error("Failed to load incidents by team:", err);

        if (mounted) {
          setTeamData([]);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load team incidents."
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTeamData();

    return () => {
      mounted = false;
    };
  }, [retryCount]);

  const handleTeamClick = (label: string) => {
    const lower = label.toLowerCase();

    if (lower.includes("2nd") || lower.includes("second")) {
      navigate("/team/2nd-line-live");
    } else if (lower.includes("major")) {
      navigate("/major-incidents/live");
    } else {
      navigate("/team/1st-line-live");
    }
  };

  const maxValue = Math.max(
    10,
    ...teamData.map((team) => team.value)
  );

  return (
    <section className="dashboard-card dashboard-team-card">
      <div className="dashboard-card-header">
        <h2>Open Incidents by Team</h2>

        <button
          type="button"
          className="dashboard-round-action"
          aria-label="Open team incidents"
          onClick={() => navigate("/team/1st-line-live")}
          title="Open Team Incidents"
          style={{ cursor: "pointer" }}
        >
          →
        </button>
      </div>

      {isLoading ? (
        <div className="dashboard-loading" role="status">
          Loading team incidents...
        </div>
      ) : error ? (
        <div className="dashboard-empty" role="alert">
          <strong>Unable to load team incidents</strong>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Retry
          </button>
        </div>
      ) : teamData.length === 0 ? (
        <div className="dashboard-empty">
          <strong>No open incidents</strong>
          <span>There are no team incidents to display.</span>
        </div>
      ) : (
        <div className="team-chart">
          <div className="team-axis" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => (
              <span key={index}>
                {Math.round((maxValue * (9 - index)) / 9)}
              </span>
            ))}
            <span>0</span>
          </div>

          <div className="team-chart-main">
            <div className="team-grid-lines" aria-hidden="true">
              {Array.from({ length: 9 }, (_, index) => (
                <span key={index} />
              ))}
            </div>

            <div className="team-bars">
              {teamData.map((team) => (
                <button
                  key={team.label}
                  type="button"
                  className="team-bar-column"
                  onClick={() => handleTeamClick(team.label)}
                  title={`View ${team.label} incidents`}
                  aria-label={`${team.label}: ${team.value} incidents. View team incidents`}
                  style={{
                    cursor: "pointer",
                    border: 0,
                    padding: 0,
                    background: "transparent",
                    font: "inherit",
                  }}
                >
                  <span className="team-bar-plot">
                    <span
                      className="team-bar"
                      style={{
                        height: `${(team.value / maxValue) * 100}%`,
                      }}
                    >
                      <span className="team-bar-number">
                        {team.value}
                      </span>
                    </span>
                  </span>

                  <span className="team-bar-label">{team.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}