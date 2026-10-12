import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import {
  DASHBOARD_TICKETS,
  type DashboardPriority,
} from "./dashboard.data";

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
    <span className="dashboard-ticket-avatar">
      <span className="dashboard-ticket-head" />
      <span className="dashboard-ticket-body" />
      <span className="dashboard-ticket-status" />
    </span>
  );
}

export default function DashboardTickets({
  isLoading = false,
  isEmpty = false,
  isError = false,
}: DashboardTicketsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentAgentName = user?.fullName || "Inesh Agarwal";

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pageSize = 4;

  const totalPages = Math.ceil(DASHBOARD_TICKETS.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const pagedTickets = DASHBOARD_TICKETS.slice(startIndex, startIndex + pageSize);

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

  const handleTicketClick = (ticket: (typeof DASHBOARD_TICKETS)[number]) => {
    if (ticket.type === "Major Incident") {
      navigate("/major-incidents/live");
    } else if (ticket.type === "Project Task") {
      navigate("/projects");
    } else if (ticket.type === "Service Request") {
      navigate("/services-catalogue");
    } else {
      navigate("/incidents");
    }
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
                : `${startIndex + 1}–${Math.min(startIndex + pageSize, DASHBOARD_TICKETS.length)} of ${DASHBOARD_TICKETS.length}`}
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
                  <tr key={ticket.id}>
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
                    title={`Open in ${ticket.type === "Major Incident" ? "Major Incidents Live" : ticket.type === "Project Task" ? "Projects" : ticket.type === "Service Request" ? "Services Catalogue" : "Incidents"}`}
                    style={{ cursor: 'pointer', fontWeight: 600 }}
                  >
                    {ticket.id}
                  </td>

                  <td>{ticket.type}</td>

                  <td
                    className="dashboard-link-cell"
                    onClick={() => handleTicketClick(ticket)}
                    title={`Open in ${ticket.type === "Major Incident" ? "Major Incidents Live" : ticket.type === "Project Task" ? "Projects" : ticket.type === "Service Request" ? "Services Catalogue" : "Incidents"}`}
                    style={{ cursor: 'pointer' }}
                  >
                    {ticket.summary}
                  </td>

                  <td>
                    <span className="dashboard-agent">
                      <TicketAvatar />
                      <span>{ticket.agent === 'Inesh Agarwal' || ticket.agent === 'Demo User' ? currentAgentName : ticket.agent}</span>
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
    </section>
  );
}