
import { useEffect, useState } from "react";
import { useAuth } from "../Auth/AuthContext";
import type {
  DashboardTicket,
  DashboardPriority,
} from "./dashboard.data";
import {
  TicketDetailModal,
  type FullTicket,
} from "../../components/TicketDetailModal";
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
        <svg
          className="w-3.5 h-3.5 text-cyan-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.378 1.157.062 1.638A8.04 8.04 0 0112 20.25z"
          />
        </svg>
      </div>
      <span className="table-bubble-dot" />
    </div>
  );
}

export default function DashboardTickets({
  isLoading: parentLoading = false,
  isEmpty = false,
  isError: parentError = false,
}: DashboardTicketsProps) {
  const { user } = useAuth();
  const currentAgentName = user?.fullName || "Current Agent";

  const [tickets, setTickets] = useState<DashboardTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState(false);
  const [selectedTicket, setSelectedTicket] =
    useState<DashboardTicket | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const pageSize = 4;
  const loading = parentLoading || ticketsLoading;
  const error = parentError || ticketsError;

  useEffect(() => {
    let mounted = true;

    async function loadTickets() {
      setTicketsLoading(true);
      setTicketsError(false);

      try {
        const data = await dashboardService.getNewTickets();

        if (!mounted) return;

        if (!Array.isArray(data)) {
          setTickets([]);
          setTicketsError(true);
          return;
        }

        setTickets(data);
        setCurrentPage(1);
      } catch (error) {
        console.error("Failed to load dashboard tickets:", error);

        if (mounted) {
          setTickets([]);
          setTicketsError(true);
        }
      } finally {
        if (mounted) {
          setTicketsLoading(false);
        }
      }
    }

    void loadTickets();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(tickets.length / pageSize));

    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [tickets.length, currentPage]);

  useEffect(() => {
    const existingIds = new Set(tickets.map((ticket) => ticket.id));

    setSelectedIds((previous) =>
      previous.filter((id) => existingIds.has(id))
    );
  }, [tickets]);

  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedTickets = tickets.slice(startIndex, startIndex + pageSize);

  const allVisibleSelected =
    pagedTickets.length > 0 &&
    pagedTickets.every((ticket) => selectedIds.includes(ticket.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((previous) =>
        previous.filter(
          (id) => !pagedTickets.some((ticket) => ticket.id === id)
        )
      );
      return;
    }

    const visibleIds = pagedTickets.map((ticket) => ticket.id);

    setSelectedIds((previous) => [
      ...new Set([...previous, ...visibleIds]),
    ]);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const handleModalUpdateTicket = (updated: FullTicket) => {
    setSelectedTicket(updated);

    // This updates local UI state only.
    // Persist changes through an approved backend API before treating
    // ticket edits as saved.
    setTickets((previous) =>
      previous.map((ticket) =>
        ticket.id === updated.id
          ? {
              ...ticket,
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
          : ticket
      )
    );
  };

  const paginationLabel =
    loading || error || isEmpty || tickets.length === 0
      ? "0 of 0"
      : `${startIndex + 1}–${Math.min(
          startIndex + pageSize,
          tickets.length
        )} of ${tickets.length}`;

  return (
    <section className="dashboard-card dashboard-tickets-card">
      <div className="dashboard-card-header">
        <div
          className="dashboard-card-heading"
          onClick={() => setIsCollapsed((previous) => !previous)}
          style={{ cursor: "pointer", userSelect: "none" }}
          title={isCollapsed ? "Expand section" : "Collapse section"}
        >
          <h2>My New Tickets</h2>
          <span className="dashboard-card-chevron">
            {isCollapsed ? "›" : "⌄"}
          </span>
        </div>

        {!isCollapsed && (
          <div className="dashboard-table-pagination">
            <span>{paginationLabel}</span>

            <button
              type="button"
              aria-label="Previous page"
              disabled={loading || error || currentPage <= 1}
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next page"
              disabled={
                loading || error || currentPage >= totalPages
              }
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

      {!isCollapsed && selectedIds.length > 0 && (
        <div
          className="tickets-bulk-actions-bar"
          style={{ margin: "10px 20px" }}
        >
          <div className="bulk-selection-count">
            <span className="bulk-badge">{selectedIds.length}</span>
            <span>
              ticket{selectedIds.length > 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="bulk-actions-buttons">
            <button
              type="button"
              className="bulk-btn bulk-btn-clear"
              onClick={() => setSelectedIds([])}
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {!isCollapsed &&
        (loading ? (
          <div className="dashboard-loading">
            Loading new tickets...
          </div>
        ) : error ? (
          <div className="dashboard-empty" role="alert">
            <strong>Unable to load new tickets</strong>
            <span>
              Check your login session and the API response, then try again.
            </span>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : isEmpty || tickets.length === 0 ? (
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
                    onClick={(event) => {
                      if (
                        (event.target as HTMLElement).tagName === "INPUT"
                      ) {
                        return;
                      }

                      setSelectedTicket(ticket);
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
                      title="View ticket details"
                      style={{ cursor: "pointer", fontWeight: 600 }}
                    >
                      {ticket.id}
                    </td>

                    <td>{ticket.type}</td>

                    <td
                      className="dashboard-link-cell"
                      title="View ticket details"
                    >
                      {ticket.summary}
                    </td>

                    <td>
                      <span className="dashboard-agent">
                        <TicketAvatar />
                        <span>{ticket.agent || "Unassigned"}</span>
                      </span>
                    </td>

                    <td>
                      <span className="dashboard-priority">
                        <span
                          className={`dashboard-priority-square ${
                            PRIORITY_CLASS[ticket.priority] ??
                            PRIORITY_CLASS.Unassigned
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
