import type { NewTicket } from "./incidents.data";
import { PriorityPill, StatusPill } from "./Badges";

type NewTicketsProps = {
  tickets: NewTicket[];
};

export default function NewTickets({
  tickets,
}: NewTicketsProps) {
  return (
    <section className="incident-card tickets-card">
      <div className="incident-card-title">
        <h2>My New Tickets</h2>
      </div>

      <div className="incident-table-container">
        {tickets.length === 0 ? (
          <div className="incident-empty-state">
            <h3>No new tickets</h3>
            <p>
              There are currently no new tickets
              available.
            </p>
          </div>
        ) : (
          <table className="incident-table ticket-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Ticket Type</th>
                <th>Summary</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>{ticket.id}</td>

                  <td>{ticket.type}</td>

                  <td>{ticket.summary}</td>

                  <td>{ticket.category}</td>

                  <td>
                    <PriorityPill
                      priority={ticket.priority}
                    />
                  </td>

                  <td>
                    <StatusPill
                      status={ticket.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}