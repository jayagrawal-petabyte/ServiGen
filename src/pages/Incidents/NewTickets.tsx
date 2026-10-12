import { useState } from "react";
import type { NewTicket, Priority } from "./incidents.data";

type NewTicketsProps = {
  tickets: NewTicket[];
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

export default function NewTickets({ tickets }: NewTicketsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const start = tickets.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const end = Math.min(activePage * pageSize, tickets.length);
  const pagedTickets = tickets.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <section className="incident-card tickets-card">
      <div className="incident-card-title tickets-card-title">
        <div className="tickets-heading">
          <h2>My New Tickets</h2>
          <span className="tickets-heading-arrow">⌄</span>
        </div>

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
      </div>

      {tickets.length === 0 ? (
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
                  <input type="checkbox" aria-label="Select all tickets" />
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
                    />
                  </td>
                  <td>{ticket.id}</td>
                  <td>{ticket.type}</td>
                  <td className="ticket-summary">{ticket.summary}</td>
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
      )}
    </section>
  );
}