
import { useEffect, useState } from "react";
import type { NewTicket, Priority } from "./incidents.data";
import {
  TicketDetailModal,
  type FullTicket,
} from "../../components/TicketDetailModal";

type NewTicketsProps = {
  tickets: NewTicket[];
  onUpdateTickets?: (updated: NewTicket[]) => void;
};

const PRIORITY_MARKERS: Record<Priority, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#65c51b",
  Unassigned: "#94a3b8",
};

function displayValue(value?: string | null): string {
  if (typeof value !== "string" || !value.trim()) {
    return "—";
  }

  return value;
}

function formatDate(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TicketPriority({ priority }: { priority: Priority }) {
  const color = PRIORITY_MARKERS[priority] ?? "#94a3b8";

  return (
    <span className="ticket-priority">
      <span
        className="ticket-priority-dot"
        style={{ background: color }}
        aria-hidden="true"
      />
      {priority}
    </span>
  );
}

function TicketAvatar({ agent }: { agent: string }) {
  const displayAgent =
    !agent || !agent.trim() ? "Unassigned" : agent;

  return (
    <span className="ticket-agent-cell">
      <span className="table-bubble-avatar" aria-hidden="true">
        <span className="table-bubble-circle">
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
        </span>
        <span className="table-bubble-dot" />
      </span>

      <span className="ticket-agent-name font-medium">
        {displayAgent}
      </span>
    </span>
  );
}

export default function NewTickets({
  tickets,
}: NewTicketsProps) {
  const [selectedTicket, setSelectedTicket] =
    useState<NewTicket | null>(null);

  const [hoveredTicketId, setHoveredTicketId] =
    useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const pageSize = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(tickets.length / pageSize)
  );

  const activePage = Math.min(currentPage, totalPages);

  const start =
    tickets.length === 0
      ? 0
      : (activePage - 1) * pageSize + 1;

  const end = Math.min(activePage * pageSize, tickets.length);

  const pagedTickets = tickets.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize
  );

  // Remove selections for tickets no longer present in API data.
  useEffect(() => {
    const currentIds = new Set(tickets.map((ticket) => ticket.id));

    setSelectedIds((previous) =>
      previous.filter((id) => currentIds.has(id))
    );
  }, [tickets]);

  // Reset pagination if the API returns fewer tickets.
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const allVisibleSelected =
    pagedTickets.length > 0 &&
    pagedTickets.every((ticket) =>
      selectedIds.includes(ticket.id)
    );

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

    setSelectedIds((previous) =>
      Array.from(new Set([...previous, ...visibleIds]))
    );
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const handleTicketClick = (ticket: NewTicket) => {
    setSelectedTicket(ticket);
  };

  // The backend update endpoint has not been confirmed.
  // Do not display local-only edits as successfully saved.
  const handleModalUpdateTicket = (_updated: FullTicket) => {
    window.alert(
      "Ticket updates are not connected to the backend yet. No changes have been saved."
    );
  };

  return (
    <section className="incident-card tickets-card">
      <div className="incident-card-title tickets-card-title">
        <button
          type="button"
          className="tickets-heading"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          aria-expanded={!isCollapsed}
          style={{
            cursor: "pointer",
            userSelect: "none",
            border: 0,
            background: "transparent",
            color: "inherit",
            font: "inherit",
          }}
          title={isCollapsed ? "Expand section" : "Collapse section"}
        >
          <h2>My New Tickets</h2>
          <span className="tickets-heading-arrow" aria-hidden="true">
            {isCollapsed ? "›" : "▾"}
          </span>
        </button>

        {!isCollapsed && (
          <div className="tickets-pagination">
            <span>
              {start}–{end} of {tickets.length}
            </span>

            <button
              type="button"
              aria-label="Previous page"
              disabled={activePage <= 1}
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next page"
              disabled={activePage >= totalPages}
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
        <div className="tickets-bulk-actions-bar">
          <div className="bulk-selection-count">
            <span className="bulk-badge">{selectedIds.length}</span>
            <span>
              ticket{selectedIds.length === 1 ? "" : "s"} selected
            </span>
          </div>

          <div
            className="bulk-actions-buttons"
            title="Bulk operations are unavailable until backend update endpoints are confirmed."
          >
            <button
              type="button"
              className="bulk-btn bulk-btn-assign"
              disabled
            >
              Assign to Me
            </button>

            <select
              className="bulk-select"
              aria-label="Set priority for selected tickets"
              value=""
              disabled
            >
              <option value="">Set Priority</option>
            </select>

            <button
              type="button"
              className="bulk-btn bulk-btn-delete"
              disabled
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

      {!isCollapsed &&
        (tickets.length === 0 ? (
          <div className="incident-empty-state" role="status">
            <h3>No new tickets found</h3>
            <p>
              No tickets were returned by the backend for this view.
            </p>
          </div>
        ) : (
          <div className="ticket-table-scroll">
            <table className="incident-table ticket-table">
              <thead>
                <tr>
                  <th className="ticket-check-column" scope="col">
                    <input
                      type="checkbox"
                      aria-label="Select all tickets on this page"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th scope="col">ID</th>
                  <th scope="col">Ticket Type</th>
                  <th scope="col">Summary</th>
                  <th scope="col">Agent</th>
                  <th scope="col">Priority</th>
                </tr>
              </thead>

              <tbody>
                {pagedTickets.map((ticket) => {
                  const isHovered =
                    hoveredTicketId === ticket.id;

                  return (
                    <tr
                      key={ticket.id}
                      className={`incident-row ${
                        isHovered ? "row-hovered" : ""
                      }`}
                      onClick={() => handleTicketClick(ticket)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="ticket-check-column">
                        <input
                          type="checkbox"
                          aria-label={`Select ticket ${ticket.id}`}
                          checked={selectedIds.includes(ticket.id)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => toggleSelectOne(ticket.id)}
                        />
                      </td>

                      <td
                        className="ticket-id-link"
                        title="View ticket details"
                      >
                        {displayValue(ticket.id)}
                      </td>

                      <td>{displayValue(ticket.type)}</td>

                      <td
                        className="ticket-summary-cell"
                        onMouseEnter={() =>
                          setHoveredTicketId(ticket.id)
                        }
                        onMouseLeave={() =>
                          setHoveredTicketId(null)
                        }
                      >
                        <button
                          type="button"
                          className="ticket-summary-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleTicketClick(ticket);
                          }}
                          title="View ticket details"
                        >
                          {displayValue(ticket.summary)}
                        </button>

                        {isHovered && (
                          <div className="ticket-hover-popover">
                            <div className="hover-popover-arrow" />

                            <div className="hover-popover-header">
                              <span className="hover-ticket-num">
                                Ticket #{displayValue(ticket.id)}
                              </span>
                              <span className="hover-flag-icon">
                                {displayValue(ticket.status)}
                              </span>
                            </div>

                            <div className="hover-popover-title-row">
                              <h4 className="hover-popover-heading">
                                {displayValue(ticket.summary)}
                              </h4>

                              <span className="hover-popover-ago">
                                {formatDate(ticket.createdAt)}
                              </span>
                            </div>

                            <p className="hover-popover-desc">
                              {displayValue(ticket.description) === "—"
                                ? "No description was provided by the backend."
                                : ticket.description}
                            </p>
                          </div>
                        )}
                      </td>

                      <td>
                        <TicketAvatar agent={ticket.agent} />
                      </td>

                      <td>
                        <TicketPriority priority={ticket.priority} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateTicket={handleModalUpdateTicket}
        />
      )}
    </section>
  );
}
