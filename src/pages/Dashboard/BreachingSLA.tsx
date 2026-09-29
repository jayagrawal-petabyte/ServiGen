import {
  SLA_INCIDENTS,
  type DashboardPriority,
} from "./dashboard.data";

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
  return (
    <section className="dashboard-card dashboard-sla-card">
      <div className="dashboard-card-header">
        <div className="dashboard-card-heading">
          <h2>Breaching SLA</h2>
          <span className="dashboard-card-chevron">⌄</span>
        </div>

        <div className="dashboard-table-pagination">
          <span>1–10 of 148</span>

          <button type="button" aria-label="Previous page">
            ‹
          </button>

          <button type="button" aria-label="Next page">
            ›
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="dashboard-loading">
          Loading SLA incidents...
        </div>
      ) : SLA_INCIDENTS.length === 0 ? (
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
                  <input type="checkbox" aria-label="Select all" />
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
              {SLA_INCIDENTS.map((incident) => (
                <tr key={incident.id}>
                  <td className="dashboard-check-cell">
                    <input
                      type="checkbox"
                      aria-label={`Select ${incident.id}`}
                    />
                  </td>

                  <td>{incident.id}</td>

                  <td>{incident.type}</td>

                  <td className="dashboard-link-cell">
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
      )}
    </section>
  );
}