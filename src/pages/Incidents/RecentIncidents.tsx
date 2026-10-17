import type { RecentIncident } from "./incidents.data";
import { PriorityPill, StatusPill } from "./Badges";

type RecentIncidentsProps = {
  incidents: RecentIncident[];
  onSelectIncident: (
    incident: RecentIncident
  ) => void;
};

export default function RecentIncidents({
  incidents,
  onSelectIncident,
}: RecentIncidentsProps) {
  return (
    <section className="incident-card recent-card">
      <div className="incident-card-title">
        <h2>Recent Incidents</h2>

        <button
          type="button"
          className="view-all-button"
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }}
        >
          View All
        </button>
      </div>

      <div className="incident-table-container">
        {incidents.length === 0 ? (
          <div className="incident-empty-state">
            <h3>No incidents found</h3>
            <p>
              No incidents match the current search.
            </p>
          </div>
        ) : (
          <table className="incident-table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {incidents.map((incident) => (
                <tr
                  key={incident.id}
                  onClick={() =>
                    onSelectIncident(incident)
                  }
                  className="incident-row"
                >
                  <td>{incident.id}</td>

                  <td>{incident.subject}</td>

                  <td>
                    <PriorityPill
                      priority={incident.priority}
                    />
                  </td>

                  <td>
                    <StatusPill
                      status={incident.status}
                    />
                  </td>

                  <td>{incident.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}