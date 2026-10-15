import { useState } from "react";
import {
  SLA_INCIDENTS,
  type SlaIncident,
  type DashboardPriority,
} from "./dashboard.data";
import { TicketDetailModal, type FullTicket } from "../../components/TicketDetailModal";
import { useAuth } from "../Auth/AuthContext";

type BreachingSLAProps = {
  isLoading?: boolean;
};

const PRIORITY_CLASS: Record<DashboardPriority, string> = {
  Critical: "dashboard-priority-critical",
  High: "dashboard-priority-high",
  Medium: "dashboard-priority-medium",
  Low: "dashboard-priority-low",
  Unassigned: "dashboard-priority-unassigned",
};

function AgentIcon() {
  return (
    <span className="dashboard-agent-icon">
      <span className="dashboard-agent-head" />
      <span className="dashboard-agent-body" />
    </span>
  );
}

export default function BreachingSLA({
  isLoading = false,
}: BreachingSLAProps) {
  const { user } = useAuth();
  const currentAgentName = user?.fullName || "Inesh Agarwal";

  const [incidents, setIncidents] = useState<SlaIncident[]>(SLA_INCIDENTS);
  const [selectedTicket, setSelectedTicket] = useState<SlaIncident | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pageSize = 4;

  const totalPages = Math.ceil(incidents.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const pagedIncidents = incidents.slice(startIndex, startIndex + pageSize);

  const allVisibleSelected =
    pagedIncidents.length > 0 && pagedIncidents.every((inc) => selectedIds.includes(inc.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pagedIncidents.some((inc) => inc.id === id)));
    } else {
      const visibleIds = pagedIncidents.map((inc) => inc.id);
      setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleIncidentClick = (incident: SlaIncident) => {
    setSelectedTicket(incident);
  };

  const handleModalUpdateTicket = (updated: FullTicket) => {
    setSelectedTicket((prev) =>
      prev
        ? {
            ...prev,
            agent: updated.agent,
            priority: updated.priority as DashboardPriority,
            summary: updated.summary,
          }
        : null
    );
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === updated.id
          ? {
              ...inc,
              agent: updated.agent,
              priority: updated.priority as DashboardPriority,
              summary: updated.summary,
            }
          : inc
      )
    );
  };

  const handleBulkAssignToMe = () => {
    setIncidents((prev) =>
      prev.map((inc) =>
        selectedIds.includes(inc.id) ? { ...inc, agent: currentAgentName } : inc
      )
    );
    setSelectedIds([]);
  };

  const handleBulkSetPriority = (priority: DashboardPriority) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        selectedIds.includes(inc.id) ? { ...inc, priority } : inc
      )
    );
    setSelectedIds([]);
  };

  return (
    <section className="dashboard-card dashboard-sla-card">
      <div className="dashboard-card-header">
        <div
          className="dashboard-card-heading"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ cursor: "pointer", userSelect: "none" }}
          title={isCollapsed ? "Expand section" : "Collapse section"}
        >
          <h2>Breaching SLA</h2>
          <span className="dashboard-card-chevron">{isCollapsed ? "›" : "⌄"}</span>
        </div>

        {!isCollapsed && (
          <div className="dashboard-table-pagination">
            <span>
              {startIndex + 1}–{Math.min(startIndex + pageSize, SLA_INCIDENTS.length)} of {SLA_INCIDENTS.length}
            </span>

            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{ cursor: currentPage > 1 ? "pointer" : "default" }}
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{ cursor: currentPage < totalPages ? "pointer" : "default" }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && selectedIds.length > 0 && (
        <div className="tickets-bulk-actions-bar" style={{ margin: "10px 20px" }}>
          <div className="bulk-selection-count">
            <span className="bulk-badge">{selectedIds.length}</span>
            <span>incident{selectedIds.length > 1 ? "s" : ""} selected</span>
          </div>

          <div className="bulk-actions-buttons">
            <button
              type="button"
              className="bulk-btn bulk-btn-assign"
              onClick={handleBulkAssignToMe}
              title={`Assign selected incidents to ${currentAgentName}`}
            >
              Assign to Me
            </button>

            <div className="bulk-priority-dropdown-wrap">
              <select
                className="bulk-select"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkSetPriority(e.target.value as DashboardPriority);
                    e.target.value = "";
                  }
                }}
                aria-label="Set priority for selected incidents"
              >
                <option value="" disabled>Set Priority ▾</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <button
              type="button"
              className="bulk-btn bulk-btn-clear"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {!isCollapsed && (
        isLoading ? (
          <div className="dashboard-loading">
            Loading SLA incidents...
          </div>
        ) : incidents.length === 0 ? (
          <div className="dashboard-empty">
            <strong>No SLA breaches</strong>
            <span>No incidents are currently breaching SLA.</span>
          </div>
        ) : (
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th className="dashboard-check-cell">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>ID</th>
                  <th>Ticket Type</th>
                  <th>Summary</th>
                  <th>Agent</th>
                  <th>Priority</th>
                  <th>SLA Time Left</th>
                </tr>
              </thead>

              <tbody>
                {pagedIncidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName === "INPUT") return;
                      handleIncidentClick(incident);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="dashboard-check-cell">
                      <input
                        type="checkbox"
                        aria-label={`Select ${incident.id}`}
                        checked={selectedIds.includes(incident.id)}
                        onChange={() => toggleSelectOne(incident.id)}
                      />
                    </td>

                    <td
                      className="dashboard-link-cell"
                      onClick={() => handleIncidentClick(incident)}
                      title={`View complete details for ${incident.id}`}
                      style={{ cursor: 'pointer', fontWeight: 600 }}
                    >
                      {incident.id}
                    </td>

                    <td>{incident.type}</td>

                    <td
                      className="dashboard-link-cell"
                      onClick={() => handleIncidentClick(incident)}
                      title={`View complete details for ${incident.id}`}
                      style={{ cursor: 'pointer' }}
                    >
                      {incident.summary}
                    </td>

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

                    <td>
                      <span className="dashboard-sla-time">
                        {incident.slaTime}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          currentUser={currentAgentName}
          onClose={() => setSelectedTicket(null)}
          onUpdateTicket={handleModalUpdateTicket}
        />
      )}
    </section>
  );
}