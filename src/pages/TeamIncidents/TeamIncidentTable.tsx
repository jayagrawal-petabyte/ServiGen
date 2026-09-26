import { useState } from "react";
import TeamIncidentFilters from "./TeamIncidentFilters";
import SLAIndicator from "./SLAIndicator";
import PriorityIndicator from "./PriorityIndicator";
import "./TeamIncidents.css";

interface Incident {
  id: string;
  sla: string;
  summary: string;
  category: string;
  priority: string;
  status: string;
  type: string;
}

interface TeamIncidentTableProps {
  team: string;
  mode: string;
}

const incidents: Incident[] = [
  {
    id: "0003910",
    sla: "-18:53",
    summary: "Screen share button does not work",
    category: "Office Applications",
    priority: "Medium",
    status: "In Progress",
    type: "Incident",
  },
  {
    id: "0003576",
    sla: "-42:54",
    summary: "Audio echo looping when two people join",
    category: "Collaboration Tools",
    priority: "Low",
    status: "In Progress",
    type: "Incident",
  },
  {
    id: "0003357",
    sla: "05:05",
    summary: "Account locked while working from home",
    category: "Security",
    priority: "Medium",
    status: "In Progress",
    type: "Incident",
  },
  {
    id: "0003269",
    sla: "05:05",
    summary: "VPN worked yesterday, now says unavailable",
    category: "Network",
    priority: "Medium",
    status: "In Progress",
    type: "Incident",
  },
];

function TeamIncidentTable({
  team,
  mode,
}: TeamIncidentTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");

  const filteredIncidents = incidents.filter((incident) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      incident.id.toLowerCase().includes(searchValue) ||
      incident.summary.toLowerCase().includes(searchValue) ||
      incident.category.toLowerCase().includes(searchValue);

    const matchesStatus =
      status === "All" || incident.status === status;

    const matchesPriority =
      priority === "All" || incident.priority === priority;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority
    );
  });

  return (
    <div className="team-incidents-page">

      <div className="team-incidents-header">
        <div>
          <h1>Incidents by Team</h1>
          <p>
            {team} - {mode}
          </p>
        </div>
      </div>

      <TeamIncidentFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        priority={priority}
        setPriority={setPriority}
      />

      <div className="incident-table-container">

        <div className="incident-table-toolbar">

          <div className="incident-toolbar-left">
            <span className="incident-title">
              Open Incidents
            </span>

            <button
              type="button"
              className="toolbar-icon-button"
              aria-label="Add"
            >
              +
            </button>
          </div>

          <div className="incident-toolbar-right">

            <span className="incident-count">
              {filteredIncidents.length > 0
                ? `1-${filteredIncidents.length} of ${filteredIncidents.length}`
                : "0 of 0"}
            </span>

            <button
              type="button"
              className="toolbar-icon-button"
              aria-label="Previous"
            >
              ‹
            </button>

            <button
              type="button"
              className="toolbar-icon-button"
              aria-label="Next"
            >
              ›
            </button>

            <button
              type="button"
              className="new-incident-button"
            >
              + New
            </button>

          </div>
        </div>

        <table className="incident-table">

          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all incidents"
                />
              </th>

              <th>Viewing</th>
              <th>ID</th>
              <th>SLA Time Left</th>
              <th>Summary</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Type</th>
            </tr>
          </thead>

          <tbody>

            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((incident) => (
                <tr key={incident.id}>

                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${incident.id}`}
                    />
                  </td>

                  <td>
                    <span
                      className="viewing-indicator"
                      aria-label="Currently viewing"
                    >
                      ●
                    </span>
                  </td>

                  <td>{incident.id}</td>

                  <td>
                    <SLAIndicator
                      time={incident.sla}
                    />
                  </td>

                  <td>{incident.summary}</td>

                  <td>{incident.category}</td>

                  <td>
                    <PriorityIndicator
                      priority={incident.priority}
                    />
                  </td>

                  <td>
                    <span
                      className={`status status-${incident.status
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {incident.status}
                    </span>
                  </td>

                  <td>{incident.type}</td>

                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="empty-state"
                >
                  No incidents found.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>
    </div>
  );
}

export default TeamIncidentTable;