import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { NewTicket, Priority } from "./incidents.data";

type NewTicketsProps = {
  tickets: NewTicket[];
  onUpdateTickets?: (updated: NewTicket[]) => void;
};

const PRIORITY_MARKERS: Record<Priority, string> = {
  Critical: "#d94b4b",
  High: "#ed9918",
  Medium: "#e4cb20",
  Low: "#65c51b",
  Unassigned: "#9ba3ad",
};

function TicketPriority({ priority }: { priority: Priority }) {
  return (
    <span className="ticket-priority">
      <span
        className="ticket-priority-dot"
        style={{ background: PRIORITY_MARKERS[priority] }}
      />
      {priority}
    </span>
  );
}

function TicketAvatar({ agent }: { agent: string }) {
  return (
    <span className="ticket-agent">
      <span className="ticket-agent-avatar">
        <span className="ticket-agent-head" />
        <span className="ticket-agent-body" />
        <span className="ticket-agent-dot" />
      </span>
      <span className="ticket-agent-name">{agent}</span>
    </span>
  );
}

export default function NewTickets({ tickets, onUpdateTickets }: NewTicketsProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const start = tickets.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const end = Math.min(activePage * pageSize, tickets.length);
  const pagedTickets = tickets.slice((activePage - 1) * pageSize, activePage * pageSize);

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

  const handleTicketClick = (ticket: NewTicket) => {
    if (ticket.type === "Major Incident") {
      navigate("/major-incidents/live");
    } else if (ticket.type === "Project Task") {
      navigate("/projects");
    } else if (ticket.type === "Service Request") {
      navigate("/services-catalogue");
    } else {
      navigate("/team/1st-line-live");
    }
  };

  const handleBulkAssignToMe = () => {
    const updated = tickets.map((t) =>
      selectedIds.includes(t.id) ? { ...t, agent: "Inesh Agarwal" } : t
    );
    onUpdateTickets?.(updated);
    setSelectedIds([]);
  };

  const handleBulkSetPriority = (priority: Priority) => {
    const updated = tickets.map((t) =>
      selectedIds.includes(t.id) ? { ...t, priority } : t
    );
    onUpdateTickets?.(updated);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    const updated = tickets.filter((t) => !selectedIds.includes(t.id));
    onUpdateTickets?.(updated);
    setSelectedIds([]);
  };

  return (
    <section className="incident-card tickets-card">
      <div className="incident-card-title tickets-card-title">
        <div
          className="tickets-heading"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ cursor: "pointer", userSelect: "none" }}
          title={isCollapsed ? "Expand section" : "Collapse section"}
        >
          <h2>My New Tickets</h2>
          <span className="tickets-heading-arrow">{isCollapsed ? "›" : "⌄"}</span>
        </div>

        {!isCollapsed && (
          <div className="tickets-pagination">
            <span>{start}–{end} of {tickets.length}</span>
            <button
              type="button"
              aria-label="Previous page"
              disabled={activePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{ opacity: activePage <= 1 ? 0.4 : 1, cursor: activePage <= 1 ? 'default' : 'pointer' }}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={activePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{ opacity: activePage >= totalPages ? 0.4 : 1, cursor: activePage >= totalPages ? 'default' : 'pointer' }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && selectedIds.length > 0 && (
        <div className="tickets-bulk-actions-bar">
          <div className="bulk-selection-count">
            <span className="bulk-badge">{selectedIds.length}</span>
            <span>ticket{selectedIds.length > 1 ? "s" : ""} selected</span>
          </div>

          <div className="bulk-actions-buttons">
            <button
              type="button"
              className="bulk-btn bulk-btn-assign"
              onClick={handleBulkAssignToMe}
              title="Assign selected tickets to Inesh Agarwal"
            >
              Assign to Me
            </button>

            <div className="bulk-priority-dropdown-wrap">
              <select
                className="bulk-select"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkSetPriority(e.target.value as Priority);
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
        tickets.length === 0 ? (
          <div className="incident-empty-state">
            <h3>No new tickets found</h3>
            <p>There are no tickets matching the current search.</p>
          </div>
        ) : (
        <div className="ticket-table-scroll">
          <table className="incident-table ticket-table">
            <thead>
              <tr>
                <th className="ticket-check-column">
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
                  <td className="ticket-check-column">
                    <input
                      type="checkbox"
                      aria-label={`Select ${ticket.id}`}
                      checked={selectedIds.includes(ticket.id)}
                      onChange={() => toggleSelectOne(ticket.id)}
                    />
                  </td>
                  <td
                    className="ticket-id-link"
                    onClick={() => handleTicketClick(ticket)}
                    title={`Open in ${ticket.type === "Major Incident" ? "Major Incidents Live" : ticket.type === "Project Task" ? "Projects" : ticket.type === "Service Request" ? "Services Catalogue" : "Team Queue"}`}
                  >
                    {ticket.id}
                  </td>
                  <td>{ticket.type}</td>
                  <td
                    className="ticket-summary"
                    onClick={() => handleTicketClick(ticket)}
                    title={`Open in ${ticket.type === "Major Incident" ? "Major Incidents Live" : ticket.type === "Project Task" ? "Projects" : ticket.type === "Service Request" ? "Services Catalogue" : "Team Queue"}`}
                  >
                    {ticket.summary}
                  </td>
                  <td>
                    <TicketAvatar agent={ticket.agent} />
                  </td>
                  <td>
                    <TicketPriority priority={ticket.priority} />
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