
import type { KeyboardEvent } from "react";
import type { RecentIncident } from "./incidents.data";
import { PriorityPill, StatusPill } from "./Badges";
import { SlaBadge } from "../../components/shared/SlaBadge";

type RecentIncidentsProps = {
  incidents: RecentIncident[];
  onSelectIncident: (incident: RecentIncident) => void;
  onViewAll?: () => void;
};

function displayValue(value?: string | null): string {
  if (!value || !value.trim() || value === "—") {
    return "—";
  }

  return value;
}

function formatDate(dateValue?: string | null): string {
  if (!dateValue || dateValue === "—") {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RecentIncidents({
  incidents,
  onSelectIncident,
  onViewAll,
}: RecentIncidentsProps) {
  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    incident: RecentIncident
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectIncident(incident);
    }
  };

  return (
    <section
      className="incident-card recent-card"
      aria-labelledby="recent-incidents-heading"
    >
      <div className="incident-card-title">
        <h2 id="recent-incidents-heading">Recent Incidents</h2>

        <button
          type="button"
          className="view-all-button"
          onClick={onViewAll}
          disabled={!onViewAll}
          title={
            onViewAll
              ? "View all incidents"
              : "View all navigation is not connected yet"
          }
        >
          View All
        </button>
      </div>

      <div className="incident-table-container">
        {incidents.length === 0 ? (
          <div className="incident-empty-state" role="status">
            <h3>No incidents found</h3>
            <p>
              No recent incidents were returned by the API.
            </p>
          </div>
        ) : (
          <table className="incident-table">
            <thead>
              <tr>
                <th scope="col">Incident ID</th>
                <th scope="col">Subject</th>
                <th scope="col">Priority</th>
                <th scope="col">Status</th>
                <th scope="col">SLA Time Left</th>
                <th scope="col">Date</th>
              </tr>
            </thead>

            <tbody>
              {incidents.slice(0, 5).map((incident) => (
                <tr
                  key={incident.id}
                  onClick={() => onSelectIncident(incident)}
                  onKeyDown={(event) =>
                    handleRowKeyDown(event, incident)
                  }
                  tabIndex={0}
                  role="button"
                  aria-label={`View incident ${displayValue(
                    incident.id
                  )}: ${displayValue(incident.subject)}`}
                  className="incident-row"
                >
                  <td>{displayValue(incident.id)}</td>

                  <td>{displayValue(incident.subject)}</td>

                  <td>
                    <PriorityPill priority={incident.priority} />
                  </td>

                  <td>
                    <StatusPill status={incident.status} />
                  </td>

                  <td>
                    <SlaBadge slaTimeLeft={incident.slaTimeLeft} />
                  </td>

                  <td>{formatDate(incident.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
