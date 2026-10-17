import { useState, useEffect } from "react";
import { useAuth } from "../Auth/AuthContext";
import {
  DASHBOARD_TICKETS,
  type DashboardTicket,
  type DashboardPriority,
} from "./dashboard.data";
import { TicketDetailModal, type FullTicket } from "../../components/TicketDetailModal";
import { usePersistentState } from "../../utils/persistentState";
import dashboardService from "../../services/dashboardService";

type DashboardTicketsProps = {
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
};

const PRIORITY_CLASS: Record<DashboardPriority, string> = {
  Critical: "dashboard-ticket-critical",
  High: "dashboard-ticket-high",
  Medium: "dashboard-ticket-medium",
  Low: "dashboard-ticket-low",
  Unassigned: "dashboard-ticket-unassigned",
};

function TicketAvatar() {
  return (
    <div className="table-bubble-avatar">
      <div className="table-bubble-circle">
        <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.378 1.157.062 1.638A8.04 8.04 0 0112 20.25z" />
        </svg>
      </div>
      <span className="table-bubble-dot" />
    </div>
  );
}

export default function DashboardTickets({
  isLoading = false,
  isEmpty = false,
  isError = false,
}: DashboardTicketsProps) {
  const { user } = useAuth();
  const currentAgentName = user?.fullName || "Inesh Agarwal";

  const [tickets, setTickets] = usePersistentState<DashboardTicket[]>(
    "servigen_incidents_new_tickets_v2",
    DASHBOARD_TICKETS
  );
  const [selectedTicket, setSelectedTicket] = useState<DashboardTicket | null>(null);

  useEffect(() => {
    let mounted = true;
    dashboardService.getNewTickets().then((data) => {
      if (mounted && data?.length) {
        setTickets(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pageSize = 4;

  const totalPages = Math.ceil(tickets.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const pagedTickets = tickets.slice(startIndex, startIndex + pageSize);

  const allVisibleSelected =
    pagedTickets.length > 0 && pagedTickets.every((t) => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pagedTickets.some((t) => t.id === id)));
    } else {
      const visibleIds = pagedTickets.map((t) => t.id);
      setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleTicketClick = (ticket: DashboardTicket) => {
    setSelectedTicket(ticket);
  };

  const handleModalUpdateTicket = (updated: FullTicket) => {
    setSelectedTicket(updated);
    setTickets((prev) =>
      prev.map((t) =>
        t.id === updated.id
          ? {
              ...t,
              agent: updated.agent,
              priority: updated.priority as DashboardPriority,
              summary: updated.summary,
              type: updated.type,
              status: updated.status,
              description: updated.description,
              requester: updated.requester,
              department: updated.department,
              category: updated.category,
              createdAt: updated.createdAt,
              targetSla: updated.targetSla,
              notes: updated.notes,
            }
          : t
      )
    );
  };

  const handleBulkAssignToMe = () => {
    setTickets((prev) =>
      prev.map((t) =>
        selectedIds.includes(t.id) ? { ...t, agent: currentAgentName } : t
      )
    );
    setSelectedIds([]);
  };

  const handleBulkSetPriority = (priority: DashboardPriority) => {
    setTickets((prev) =>
      prev.map((t) =>
        selectedIds.includes(t.id) ? { ...t, priority } : t
      )
    );
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    setTickets((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
    setSelectedIds([]);
  };

  return (
    <section className="dashboard-card dashboard-tickets-card">
      <div className="dashboard-card-header">
        <div
          className="dashboard-card-heading"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ cursor: "pointer", userSelect: "none" }}
          title={isCollapsed ? "Expand section" : "Collapse section"}
        >
          <h2>My New Tickets</h2>
          <span className="dashboard-card-chevron">{isCollapsed ? "›" : "⌄"}</span>
        </div>

        {!isCollapsed && (
          <div className="dashboard-table-pagination">
            <span>
              {isEmpty
                ? "0 of 0"
                : `${startIndex + 1}–${Math.min(startIndex + pageSize, tickets.length)} of ${tickets.length}`}
            </span>

            <button
              type="button"
              aria-label="Previous page"
              disabled={isEmpty || isError || isLoading || currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{ cursor: currentPage > 1 ? "pointer" : "default" }}
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next page"
              disabled={isEmpty || isError || isLoading || currentPage >= totalPages}
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
            <span>ticket{selectedIds.length > 1 ? "s" : ""} selected</span>
          </div>

          <div className="bulk-actions-buttons">
            <button
              type="button"
              className="bulk-btn bulk-btn-assign"
              onClick={handleBulkAssignToMe}
              title={`Assign selected tickets to ${currentAgentName}`}
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
                aria-label="Set priority for selected tickets"
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
              className="bulk-btn bulk-btn-delete"
              onClick={handleBulkDelete}
              title="Delete selected tickets"
            >
              Delete
            </button>

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
            Loading new tickets...
          </div>
        ) : isError ? (
          <div className="dashboard-empty">
            <strong>Unable to load new tickets</strong>
            <span>Please try again later.</span>
          </div>
        ) : isEmpty ? (
          <div className="dashboard-empty">
            <strong>No new tickets</strong>
            <span>There are currently no new tickets to display.</span>
          </div>
        ) : (
          <div className="dashboard-table-scroll">
            <table className="dashboard-table dashboard-ticket-table">
              <thead>
                <tr>
                  <th className="dashboard-check-cell">
                    <input
                      type="checkbox"
                      aria-label="Select all tickets"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>

                  <th>ID</th>
                  <th>Ticket Type</th>
                  <th>Summary</th>
                  <th>Agent</th>
                  <th>Priority</th>
                </tr>
              </thead>

              <tbody>
                {pagedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName === "INPUT") return;
                      handleTicketClick(ticket);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="dashboard-check-cell">
                      <input
                        type="checkbox"
                        aria-label={`Select ${ticket.id}`}
                        checked={selectedIds.includes(ticket.id)}
                        onChange={() => toggleSelectOne(ticket.id)}
                      />
                    </td>

                  <td
                    className="dashboard-link-cell"
                    onClick={() => handleTicketClick(ticket)}
                    title="View complete ticket and request details"
                    style={{ cursor: 'pointer', fontWeight: 600 }}
                  >
                    {ticket.id}
                  </td>

                  <td>{ticket.type}</td>

                  <td
                    className="dashboard-link-cell"
                    onClick={() => handleTicketClick(ticket)}
                    title="View complete ticket and request details"
                    style={{ cursor: 'pointer' }}
                  >
                    {ticket.summary}
                  </td>

                  <td>
                    <span className="dashboard-agent">
                      <TicketAvatar />
                      <span>{ticket.agent === 'Inesh Agarwal' || ticket.agent === 'Demo User' ? currentAgentName : ticket.agent}</span>
                      <span className="trophy-badge text-xs ml-1">🏆</span>
                    </span>
                  </td>

                  <td>
                    <span className="dashboard-priority">
                      <span
                        className={`dashboard-priority-square ${
                          PRIORITY_CLASS[ticket.priority]
                        }`}
                      />
                      {ticket.priority}
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