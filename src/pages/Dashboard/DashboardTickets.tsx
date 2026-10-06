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
  return (
    <section className="dashboard-card dashboard-tickets-card">
      <div className="dashboard-card-header">
        <div className="dashboard-card-heading">
          <h2>My New Tickets</h2>
          <span className="dashboard-card-chevron">⌄</span>
        </div>

        <div className="dashboard-table-pagination">
          <span>{isEmpty ? "0 of 0" : "1–10 of 12"}</span>

          <button
            type="button"
            aria-label="Previous page"
            disabled={isEmpty || isError || isLoading}
          >
            ‹
          </button>

          <button
            type="button"
            aria-label="Next page"
            disabled={isEmpty || isError || isLoading}
          >
            ›
          </button>
        </div>
      </div>

      {isLoading ? (
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
              {DASHBOARD_TICKETS.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="dashboard-check-cell">
                    <input
                      type="checkbox"
                      aria-label={`Select ${ticket.id}`}
                    />
                  </td>

                  <td>{ticket.id}</td>

                  <td>{ticket.type}</td>

                  <td className="dashboard-link-cell">
                    {ticket.summary}
                  </td>

                  <td>
                    <span className="dashboard-agent">
                      <TicketAvatar />
                      <span>{ticket.agent}</span>
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
      )}
    </section>
  );
}