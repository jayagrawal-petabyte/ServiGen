import { useState } from "react";
import TeamIncidentFilters from "./TeamIncidentFilters";
import SLAIndicator from "./SLAIndicator";
import PriorityIndicator from "./PriorityIndicator";

const incidents = [
  {
    id: "INC001",
    sla: "01h 42m",
    summary: "Network connection issue",
    category: "Network",
    priority: "High",
    status: "Open",
    type: "Incident",
    agent: "John",
  },
  {
    id: "INC002",
    sla: "03h 15m",
    summary: "Application login problem",
    category: "Application",
    priority: "Medium",
    status: "In Progress",
    type: "Incident",
    agent: "Sarah",
  },
  {
    id: "INC003",
    sla: "00h 28m",
    summary: "Database connection failure",
    category: "Database",
    priority: "Critical",
    status: "Open",
    type: "Incident",
    agent: "David",
  },
  {
    id: "INC004",
    sla: "05h 10m",
    summary: "Email service issue",
    category: "Service",
    priority: "Low",
    status: "Pending",
    type: "Incident",
    agent: "Emily",
  },
  {
    id: "INC005",
    sla: "01h 05m",
    summary: "Printer connectivity issue",
    category: "Hardware",
    priority: "High",
    status: "Open",
    type: "Incident",
    agent: "Michael",
  },
];

function TeamIncidentTable({ team, mode }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.id.toLowerCase().includes(search.toLowerCase()) ||
      incident.summary.toLowerCase().includes(search.toLowerCase()) ||
      incident.category.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      status === "All" || incident.status === status;

    const matchesPriority =
      priority === "All" || incident.priority === priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="team-incidents-page">
      <div className="team-incidents-header">
        <div>
          <h1>{team}</h1>
          <p>
            {mode} view of incidents assigned to {team}.
          </p>
        </div>

        <div className="view-label">
          {mode}
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
        <table className="incident-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>SLA Time Left</th>
              <th>Summary</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Type</th>
              <th>Agent</th>
              <th>Team</th>
            </tr>
          </thead>

          <tbody>
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((incident) => (
                <tr key={incident.id}>
                  <td>{incident.id}</td>

                  <td>
                    <SLAIndicator time={incident.sla} />
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
                        .replace(" ", "-")}`}
                    >
                      {incident.status}
                    </span>
                  </td>

                  <td>{incident.type}</td>

                  <td>{incident.agent}</td>

                  <td>{team}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="empty-state">
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