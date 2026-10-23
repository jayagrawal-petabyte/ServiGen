
import { useEffect, useState } from "react";
import { api } from "../../services/apiClient";

type DashboardPriority =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Unassigned";

type SlaIncident = {
  id: string;
  type: string;
  summary: string;
  agent: string;
  priority: DashboardPriority;
};

type BreachingSLAProps = {
  isLoading?: boolean;
};

type ApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

const PAGE_SIZE = 4;
const MAX_PAGE_SIZE = 100;

const PRIORITY_CLASS: Record<DashboardPriority, string> = {
  Critical: "dashboard-priority-critical",
  High: "dashboard-priority-high",
  Medium: "dashboard-priority-medium",
  Low: "dashboard-priority-low",
  Unassigned: "dashboard-priority-unassigned",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getIncidentArray(response: unknown): unknown[] {
  if (!isRecord(response)) {
    throw new Error("Invalid response from the support API.");
  }

  const envelope = response as ApiEnvelope;

  if (envelope.success === false) {
    throw new Error(
      envelope.message || "Failed to fetch support incidents."
    );
  }

  const payload = envelope.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload) && Array.isArray(payload.incidents)) {
    return payload.incidents;
  }

  if (
    isRecord(payload) &&
    isRecord(payload.data) &&
    Array.isArray(payload.data.incidents)
  ) {
    return payload.data.incidents;
  }

  throw new Error(
    "The support API response does not contain an incidents list."
  );
}

function toSlaIncident(value: unknown): SlaIncident | null {
  if (!isRecord(value) || value.slaBreach !== true) {
    return null;
  }

  if (typeof value.id !== "string" || !value.id.trim()) {
    return null;
  }

  const rawPriority =
    typeof value.priority === "string" ? value.priority : "";

  const priority: DashboardPriority = [
    "Critical",
    "High",
    "Medium",
    "Low",
  ].includes(rawPriority)
    ? (rawPriority as DashboardPriority)
    : "Unassigned";

  const rawAgent = value.agent ?? value.assignedAgent;
  let agent = "Unassigned";

  if (typeof rawAgent === "string" && rawAgent.trim()) {
    agent = rawAgent;
  } else if (isRecord(rawAgent)) {
    const name = rawAgent.fullName ?? rawAgent.name;

    if (typeof name === "string" && name.trim()) {
      agent = name;
    }
  }

  return {
    id: value.id,
    type:
      typeof value.ticketType === "string"
        ? value.ticketType
        : typeof value.type === "string"
          ? value.type
          : "Incident",
    summary:
      typeof value.summary === "string" && value.summary.trim()
        ? value.summary
        : "No summary available",
    agent,
    priority,
  };
}

function AgentIcon() {
  return (
    <span className="dashboard-agent-icon" aria-hidden="true">
      <span className="dashboard-agent-head" />
      <span className="dashboard-agent-body" />
    </span>
  );
}

export default function BreachingSLA({
  isLoading: parentLoading = false,
}: BreachingSLAProps) {
  const [incidents, setIncidents] = useState<SlaIncident[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadBreachingIncidents() {
      setIsFetching(true);
      setError(null);

      try {
        const [firstLineResponse, secondLineResponse] =
          await Promise.all([
            api.get<unknown>("/api/incidents/support/first-line", {
              params: { page: 1, limit: MAX_PAGE_SIZE },
            }),
            api.get<unknown>("/api/incidents/support/second-line", {
              params: { page: 1, limit: MAX_PAGE_SIZE },
            }),
          ]);

        const firstLine = getIncidentArray(firstLineResponse);
        const secondLine = getIncidentArray(secondLineResponse);

        const uniqueIncidents = new Map<string, SlaIncident>();

        for (const item of [...firstLine, ...secondLine]) {
          const incident = toSlaIncident(item);

          if (incident) {
            uniqueIncidents.set(incident.id, incident);
          }
        }

        if (!cancelled) {
          setIncidents(Array.from(uniqueIncidents.values()));
          setCurrentPage(1);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setIncidents([]);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load SLA incidents."
          );
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    }

    void loadBreachingIncidents();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const loading = parentLoading || isFetching;
  const totalPages = Math.max(
    1,
    Math.ceil(incidents.length / PAGE_SIZE)
  );
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedIncidents = incidents.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  return (
    <section
      className="dashboard-card dashboard-sla-card"
      aria-labelledby="breaching-sla-heading"
    >
      <div className="dashboard-card-header">
        <div className="dashboard-card-heading">
          <button
            type="button"
            className="dashboard-sla-collapse-button"
            onClick={() => setIsCollapsed((previous) => !previous)}
            aria-expanded={!isCollapsed}
            aria-controls="breaching-sla-content"
            title={isCollapsed ? "Expand section" : "Collapse section"}
          >
            <h2 id="breaching-sla-heading">Breaching SLA</h2>
            <span className="dashboard-card-chevron" aria-hidden="true">
              {isCollapsed ? "›" : "⌄"}
            </span>
          </button>
        </div>

        {!isCollapsed && (
          <div className="dashboard-table-pagination">
            <span>
              {loading || error
                ? "—"
                : incidents.length === 0
                  ? "0 of 0"
                  : `${startIndex + 1}–${Math.min(
                      startIndex + PAGE_SIZE,
                      incidents.length
                    )} of ${incidents.length}`}
            </span>

            <button
              type="button"
              aria-label="Previous page"
              disabled={loading || currentPage <= 1}
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next page"
              disabled={loading || currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
            >
              ›
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div id="breaching-sla-content">
          {loading ? (
            <div className="dashboard-loading" role="status">
              Loading SLA incidents...
            </div>
          ) : error ? (
            <div className="dashboard-empty" role="alert">
              <strong>Unable to load SLA incidents</strong>
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Retry
              </button>
            </div>
          ) : incidents.length === 0 ? (
            <div className="dashboard-empty">
              <strong>No SLA breaches</strong>
              <span>
                No SLA-breaching incidents were returned by the support APIs.
              </span>
            </div>
          ) : (
            <div className="dashboard-table-scroll">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ticket Type</th>
                    <th>Summary</th>
                    <th>Agent</th>
                    <th>Priority</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedIncidents.map((incident) => (
                    <tr key={incident.id}>
                      <td
                        className="dashboard-link-cell"
                        style={{ fontWeight: 600 }}
                      >
                        {incident.id}
                      </td>
                      <td>{incident.type}</td>
                      <td>{incident.summary}</td>
                      <td>
                        <span className="dashboard-agent">
                          <AgentIcon />
                          <span>{incident.agent}</span>
                        </span>
                      </td>
                      <td>
                        <span className="dashboard-priority">
                          <span
                            className={`dashboard-priority-square ${
                              PRIORITY_CLASS[incident.priority]
                            }`}
                          />
                          {incident.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
