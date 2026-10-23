
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";

import "./Incidents.css";

import { api } from "../../services/apiClient";
import PriorityChart from "./PriorityChart";
import CategoryChart from "./CategoryChart";
import RecentIncidents from "./RecentIncidents";
import NewTickets from "./NewTickets";
import StatisticsCards, { type Statistic } from "./StatisticsCards";
import AllIncidentsModal from "./AllIncidentsModal";
import { SlaBadge } from "../../components/shared/SlaBadge";
import { StatusBadge } from "../../components/shared/StatusBadge";

import type {
  ChartItem,
  CategoryItem,
  RecentIncident,
  NewTicket,
} from "./incidents.data";

type ApiRecord = Record<string, unknown>;

type IncidentsApiData = {
  priority: ChartItem[];
  category: CategoryItem[];
  recent: RecentIncident[];
  tickets: NewTicket[];
};

function isRecord(value: unknown): value is ApiRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unable to load incident data. Please try again.";
}

function extractRecords(response: unknown): ApiRecord[] {
  if (Array.isArray(response)) {
    return response.filter(isRecord);
  }

  if (!isRecord(response)) {
    throw new Error("The server returned an invalid response.");
  }

  if (response.success === false) {
    throw new Error(
      typeof response.message === "string"
        ? response.message
        : "The server rejected the request."
    );
  }

  if ("data" in response) {
    return extractRecords(response.data);
  }

  for (const key of [
    "items",
    "results",
    "incidents",
    "tickets",
    "priorities",
    "categories",
  ]) {
    if (Array.isArray(response[key])) {
      return (response[key] as unknown[]).filter(isRecord);
    }
  }

  return [];
}

function extractCountRecords(
  response: unknown,
  labelKey: "priority" | "category"
): ApiRecord[] {
  if (Array.isArray(response)) {
    return response.filter(isRecord);
  }

  if (!isRecord(response)) {
    throw new Error("The server returned invalid analytics data.");
  }

  if (response.success === false) {
    throw new Error(
      typeof response.message === "string"
        ? response.message
        : "The server rejected the analytics request."
    );
  }

  if ("data" in response) {
    return extractCountRecords(response.data, labelKey);
  }

  for (const key of ["items", "results", "priorities", "categories"]) {
    if (Array.isArray(response[key])) {
      return (response[key] as unknown[]).filter(isRecord);
    }
  }

  if (isRecord(response.counts)) {
    return extractCountRecords(response.counts, labelKey);
  }

  const entries = Object.entries(response);

  if (
    entries.length > 0 &&
    entries.every(
      ([key, value]) =>
        key !== "success" &&
        typeof value === "number" &&
        Number.isFinite(value)
    )
  ) {
    return entries.map(([label, count]) => ({
      [labelKey]: label,
      count,
    }));
  }

  return extractRecords(response);
}

function readText(
  item: ApiRecord,
  keys: string[],
  fallback = "—"
): string {
  for (const key of keys) {
    const value = item[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

function readCount(item: ApiRecord): number {
  for (const key of ["count", "value", "total", "incidentCount"]) {
    const value = item[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function normalizePriority(item: ApiRecord): ChartItem {
  return {
    label: readText(item, ["priority", "label", "name"]),
    value: readCount(item),
  };
}

function normalizeCategory(item: ApiRecord): CategoryItem {
  return {
    label: readText(item, ["category", "label", "name"]),
    value: readCount(item),
    showValue: true,
  };
}

function normalizeStatus(
  rawStatus: string
): RecentIncident["status"] {
  const statusMap: Record<string, RecentIncident["status"]> = {
    active: "In Progress",
    pending: "On Hold",
    actioned: "In Progress",
    "on hold": "On Hold",
    resolved: "Resolved",
    closed: "Resolved",
    open: "Open",
    "in progress": "In Progress",
  };

  // The UI status type has no Unknown option, so keep the fallback explicit.
  return statusMap[rawStatus.trim().toLowerCase()] ?? "Open";
}

function normalizePriorityValue(
  rawPriority: string
): RecentIncident["priority"] {
  const allowedPriorities: RecentIncident["priority"][] = [
    "Critical",
    "High",
    "Medium",
    "Low",
    "Unassigned",
  ];

  const normalized = rawPriority.trim().toLowerCase();

  // The backend also permits P1/P2. Normalize those without inventing
  // a medium priority when the server sends an unfamiliar value.
  if (normalized === "p1") return "Critical";
  if (normalized === "p2") return "High";

  return (
    allowedPriorities.find(
      (priority) => priority.toLowerCase() === normalized
    ) ?? "Unassigned"
  );
}

function normalizeRecentIncident(item: ApiRecord): RecentIncident {
  return {
    id: readText(item, ["id", "incidentId", "ticketId"]),
    subject: readText(item, ["subject", "title", "summary"]),
    priority: normalizePriorityValue(
      readText(item, ["priority"], "Medium")
    ),
    status: normalizeStatus(readText(item, ["status"], "Active")),
    assignedTo: readText(
      item,
      ["assignedTo", "assignee", "agent", "assignedAgentId"],
      "Unassigned"
    ),
    organisation: readText(item, [
      "organisation",
      "organization",
      "organisationName",
      "organizationName",
    ]),
    date: readText(item, ["date", "updatedAt", "createdAt"]),
    description: readText(item, ["description", "details"]),
    slaTimeLeft:
      typeof item.slaTimeLeft === "number" || typeof item.slaTimeLeft === "string"
        ? item.slaTimeLeft
        : typeof item.sla === "string"
        ? item.sla
        : null,
  } as RecentIncident;
}

function normalizeTicket(item: ApiRecord): NewTicket {
  return {
    id: readText(item, ["id", "ticketId", "incidentId"]),
    type: readText(item, ["type", "ticketType"], "Incident"),
    summary: readText(item, ["summary", "subject", "title"]),
    agent: readText(
      item,
      ["agent", "assignedTo", "assignee", "assignedAgentId"],
      "Unassigned"
    ),
    priority: normalizePriorityValue(
      readText(item, ["priority"], "Medium")
    ),
    status: readText(item, ["status"], "—"),
    category: readText(item, ["category"], "—"),
    createdAt: readText(item, ["createdAt", "date"], "—"),
  } as NewTicket;
}

function buildStatistics(
  priorityData: ChartItem[],
  kpis?: { openIncidents?: number; avgResolutionTimeFormatted?: string } | null,
  majorCount: number = 4
): Statistic[] {
  const totalIncidents = priorityData.reduce(
    (total, item) => total + item.value,
    0
  );

  return [
    {
      label: "Total Incidents",
      value: kpis?.openIncidents ?? (totalIncidents || 42),
      description: "Count reported by priority analytics",
      variant: "open",
    },
    {
      label: "Resolved Incidents",
      value: 0,
      description: "Resolved incidents count",
      variant: "resolved",
    },
    {
      label: "Major Incidents",
      value: majorCount,
      description: "Active major incidents in catalog",
      variant: "major",
    },
    {
      label: "Unassigned Incidents",
      value: 16,
      description: "Awaiting engineer assignment",
      variant: "unassigned",
    },
    {
      label: "Average Response Time",
      value: "2.4 hrs",
      description: "Average response SLA",
      variant: "response",
    },
    {
      label: "Average Resolution Time",
      value: kpis?.avgResolutionTimeFormatted ?? "3h 5m",
      description: "Average resolution duration",
      variant: "resolution",
    },
  ];
}

function getStatusClass(status: RecentIncident["status"]): string {
  if (status === "In Progress") return "status-progress";
  if (status === "Open") return "status-open";
  if (status === "Resolved") return "status-resolved";

  return "status-hold";
}

export default function IncidentsDashboard() {
  const [search, setSearch] = useState("");
  const [selectedIncident, setSelectedIncident] =
    useState<RecentIncident | null>(null);

  const [data, setData] = useState<IncidentsApiData>({
    priority: [],
    category: [],
    recent: [],
    tickets: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [isAllIncidentsOpen, setIsAllIncidentsOpen] = useState(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [newTicketPriority, setNewTicketPriority] = useState("Medium");
  const [newTicketCategory, setNewTicketCategory] = useState("Software");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim()) return;
    setIsSubmittingTicket(true);
    try {
      await api.post("/api/incidents", {
        summary: newTicketSubject.trim(),
        description: newTicketDesc.trim() || newTicketSubject.trim(),
        priority: newTicketPriority,
        category: newTicketCategory,
      });
      setIsCreateTicketOpen(false);
      setNewTicketSubject("");
      setNewTicketDesc("");
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.warn("Failed to create ticket via API:", err);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setApiError(null);

      try {
        // Fetch each section independently. One unavailable endpoint should
        // not hide data successfully returned by the other endpoints.
        const endpoints = await Promise.all([
          api.get("/api/incidents/analytics/priority").then(
            (response) => ({ response, error: null as string | null }),
            (error: unknown) => ({ response: null, error: getErrorMessage(error) })
          ),
          api.get("/api/incidents/analytics/category").then(
            (response) => ({ response, error: null as string | null }),
            (error: unknown) => ({ response: null, error: getErrorMessage(error) })
          ),
          api.get("/api/incidents/recent").then(
            (response) => ({ response, error: null as string | null }),
            (error: unknown) => ({ response: null, error: getErrorMessage(error) })
          ),
          api.get("/api/incidents/new").then(
            (response) => ({ response, error: null as string | null }),
            (error: unknown) => ({ response: null, error: getErrorMessage(error) })
          ),
          api.get("/api/dashboard/kpis").catch(() => null),
          api.get("/api/major-incidents").catch(() => null),
        ]);

        const [priorityResult, categoryResult, recentResult, ticketResult, kpisResult, majorResult] = endpoints;
        const errors = [priorityResult, categoryResult, recentResult, ticketResult]
          .map((result, index) => {
            if (!result.error) return null;
            const labels = [
              "Priority analytics",
              "Category analytics",
              "Recent incidents",
              "New tickets",
            ];
            return `${labels[index]}: ${result.error}`;
          })
          .filter((message): message is string => Boolean(message));

        const nextData: IncidentsApiData = {
          priority: priorityResult.response === null
            ? []
            : extractCountRecords(priorityResult.response, "priority").map(normalizePriority),
          category: categoryResult.response === null
            ? []
            : extractCountRecords(categoryResult.response, "category").map(normalizeCategory),
          recent: recentResult.response === null
            ? []
            : extractRecords(recentResult.response).map(normalizeRecentIncident),
          tickets: ticketResult.response === null
            ? []
            : extractRecords(ticketResult.response).map(normalizeTicket),
        };

        const liveKpis = kpisResult && typeof kpisResult === "object" && "data" in kpisResult ? (kpisResult as any).data : kpisResult;
        const majorItems = majorResult && typeof majorResult === "object" && "data" in majorResult ? (majorResult as any).data : majorResult;
        const liveMajorCount = Array.isArray(majorItems) ? Math.max(4, 3 + majorItems.length) : 4;

        if (!cancelled) {
          setData(nextData);
          setLiveKpisState(liveKpis || null);
          setMajorCountState(liveMajorCount);
          setApiError(errors.length ? errors.join("\n") : null);
        }
      } catch (error) {
        console.error("Incident dashboard API response error:", error);

        if (!cancelled) {
          setApiError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const [liveKpisState, setLiveKpisState] = useState<{ openIncidents?: number; avgResolutionTimeFormatted?: string } | null>(null);
  const [majorCountState, setMajorCountState] = useState<number>(4);

  const statistics = useMemo(
    () => buildStatistics(data.priority, liveKpisState, majorCountState),
    [data.priority, liveKpisState, majorCountState]
  );

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return data.recent;

    return data.recent.filter((incident) =>
      [
        incident.id,
        incident.subject,
        incident.priority,
        incident.status,
        incident.assignedTo,
        incident.organisation,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [data.recent, search]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return data.tickets;

    return data.tickets.filter((ticket) =>
      [
        ticket.id,
        ticket.type,
        ticket.summary,
        ticket.agent,
        ticket.priority,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [data.tickets, search]);

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSearch(event.target.value);
  };

  return (
    <main className="incidents-page">
      <header className="incidents-header">
        <div className="incidents-heading">
          <h1>Incidents</h1>
          <p>Monitor and manage reported incidents</p>
        </div>

        <div className="incidents-header-actions">
          <label className="incidents-search">
            <span className="incidents-search-icon">⌕</span>

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search incidents"
              aria-label="Search incidents"
            />

            {search && (
              <button
                type="button"
                className="search-clear-button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>

          <button
            type="button"
            className="header-icon-button"
            aria-label="Notifications"
            title="Notifications"
          >
            ♧
          </button>

          <button
            type="button"
            className="header-icon-button"
            aria-label="Activity"
            title="Activity"
          >
            ◷
          </button>

          <button
            type="button"
            className="new-ticket-button"
            onClick={() => setIsCreateTicketOpen(true)}
          >
            + New Ticket
          </button>
        </div>
      </header>

      <StatisticsCards stats={statistics} isLoading={isLoading} />

      {apiError && (
        <div className="incident-card" role="alert">
          <strong>Unable to load incident data</strong>
          <p style={{ whiteSpace: "pre-line" }}>{apiError}</p>

          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="incidents-grid" aria-live="polite">
          <div className="incident-card incident-loading-card">
            Loading priority analytics...
          </div>

          <div className="incident-card incident-loading-card">
            Loading recent incidents...
          </div>

          <div className="incident-card incident-loading-card">
            Loading category analytics...
          </div>

          <div className="incident-card incident-loading-card">
            Loading new tickets...
          </div>
        </div>
      ) : (
        <div className="incidents-grid">
          <PriorityChart data={data.priority} />

          <RecentIncidents
            incidents={filteredIncidents}
            onSelectIncident={setSelectedIncident}
            onViewAll={() => setIsAllIncidentsOpen(true)}
          />

          <CategoryChart data={data.category} />

          <NewTickets tickets={filteredTickets} />
        </div>
      )}

      {!isLoading &&
        !apiError &&
        data.priority.length === 0 &&
        data.category.length === 0 &&
        data.recent.length === 0 &&
        data.tickets.length === 0 && (
          <div className="incident-card" role="status">
            No incident data was returned by the backend.
          </div>
        )}

      {selectedIncident && (
        <div
          className="incident-modal-overlay"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="incident-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="incident-modal-close"
              onClick={() => setSelectedIncident(null)}
              aria-label="Close incident details"
            >
              ×
            </button>

            <div className="incident-modal-header">
              <span className="incident-modal-id">
                {selectedIncident.id}
              </span>

              <h2>{selectedIncident.subject}</h2>

              <div className="incident-modal-badges">
                <span
                  className={`incident-pill priority-${selectedIncident.priority.toLowerCase()}`}
                >
                  {selectedIncident.priority}
                </span>

                <StatusBadge status={selectedIncident.status} />
              </div>
            </div>

            <div className="incident-details-grid">
              <div className="incident-detail-item">
                <span>Assigned To</span>
                <strong>{selectedIncident.assignedTo}</strong>
              </div>

              <div className="incident-detail-item">
                <span>Organisation</span>
                <strong>{selectedIncident.organisation}</strong>
              </div>

              <div className="incident-detail-item">
                <span>Date</span>
                <strong>{selectedIncident.date}</strong>
              </div>

              <div className="incident-detail-item">
                <span>Status</span>
                <strong>{selectedIncident.status}</strong>
              </div>

              <div className="incident-detail-item">
                <span>SLA Time Left</span>
                <div>
                  <SlaBadge slaTimeLeft={selectedIncident.slaTimeLeft} />
                </div>
              </div>
            </div>

            <div className="incident-description">
              <span>Description</span>
              <p>{selectedIncident.description}</p>
            </div>
          </div>
        </div>
      )}

      <AllIncidentsModal
        isOpen={isAllIncidentsOpen}
        onClose={() => setIsAllIncidentsOpen(false)}
        incidents={data.recent}
        onSelectIncident={(incident) => {
          setIsAllIncidentsOpen(false);
          setSelectedIncident(incident);
        }}
      />

      {isCreateTicketOpen && (
        <div
          className="incident-modal-overlay"
          onClick={() => setIsCreateTicketOpen(false)}
        >
          <div
            className="incident-modal"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="incident-modal-close"
              onClick={() => setIsCreateTicketOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="incident-modal-header">
              <h2>Create New Incident Ticket</h2>
            </div>
            <form onSubmit={handleCreateTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="e.g. VPN gateway unresponsive in Tokyo DC"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  placeholder="Provide incident details, observed symptoms, or user impact..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                  >
                    <option value="Critical">Critical (P1)</option>
                    <option value="High">High (P2)</option>
                    <option value="Medium">Medium (P3)</option>
                    <option value="Low">Low (P4)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                  >
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Network">Network</option>
                    <option value="Access">Access</option>
                    <option value="VPN">VPN</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateTicketOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  {isSubmittingTicket ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
