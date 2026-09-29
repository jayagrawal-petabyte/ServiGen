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
  return (
    <section className="incident-card tickets-card">
      <div className="incident-card-title tickets-card-title">
        <div className="tickets-heading">
          <h2>My New Tickets</h2>
          <span className="tickets-heading-arrow">⌄</span>
        </div>

        <div className="tickets-pagination">
          <span>1–10 of 12</span>
          <button type="button" aria-label="Previous page">
            ‹
          </button>
          <button type="button" aria-label="Next page">
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
              {tickets.map((ticket) => (
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