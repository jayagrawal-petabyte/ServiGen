import { useEffect, useState } from "react";
import Pagination from "../../components/shared/Pagination";
import TeamIncidentFilters from "./TeamIncidentFilters";
import SLAIndicator from "./SLAIndicator";
import PriorityIndicator from "./PriorityIndicator";
import "./TeamIncidents.css";

interface Incident {
  id: string;
  sla: string;
  summary: string;
  category: string;
  agent: string;
  priority: string;
  status: string;
  type: string;
}

interface TeamIncidentTableProps {
  team: string;
  mode: string;
}

const initialIncidents: Incident[] = [
  {
    id: "0003910",
    sla: "-18:53",
    summary: "Screen share button does not work",
    category: "Office Applications",
    agent: "Anjali Prasad",
    priority: "Medium",
    status: "In Progress",
    type: "Incident",
  },
  {
    id: "0003576",
    sla: "-42:54",
    summary: "Audio echo looping when two people join",
    category: "Collaboration Tools",
    agent: "Mohammad Taha Ali",
    priority: "Low",
    status: "In Progress",
    type: "Incident",
  },
  {
    id: "0003357",
    sla: "05:05",
    summary: "Account locked while working from home",
    category: "Security",
    agent: "Monalisa Panda",
    priority: "Medium",
    status: "In Progress",
    type: "Incident",
  },
  {
    id: "0003269",
    sla: "05:05",
    summary: "VPN worked yesterday, now says unavailable",
    category: "Network",
    agent: "Aditya Kumar Singh",
    priority: "Medium",
    status: "In Progress",
    type: "Incident",
  },
];

const agents = [
  "Anjali Prasad",
  "Mohammad Taha Ali",
  "Monalisa Panda",
  "Aditya Kumar Singh",
];

function TeamIncidentTable({
  team,
  mode,
}: TeamIncidentTableProps) {
  const [incidents, setIncidents] =
    useState<Incident[]>(initialIncidents);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");

  const [selectedIncidents, setSelectedIncidents] =
    useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [showNewIncidentForm, setShowNewIncidentForm] =
    useState(false);

  const [selectedIncident, setSelectedIncident] =
    useState<Incident | null>(null);

  const [newSummary, setNewSummary] = useState("");

  const [newCategory, setNewCategory] =
    useState("Network");

  const [newAgent, setNewAgent] =
    useState(agents[0]);

  const [newPriority, setNewPriority] =
    useState("Medium");

  const [createError, setCreateError] =
    useState("");

  const itemsPerPage = 2;

  /* ---------------- FILTERING ---------------- */

  const filteredIncidents = incidents.filter(
    (incident) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        incident.id
          .toLowerCase()
          .includes(searchValue) ||
        incident.summary
          .toLowerCase()
          .includes(searchValue) ||
        incident.category
          .toLowerCase()
          .includes(searchValue) ||
        incident.agent
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        status === "All" ||
        incident.status === status;

      const matchesPriority =
        priority === "All" ||
        incident.priority === priority;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    }
  );

  /* ---------------- PAGINATION ---------------- */

  const totalPages = Math.ceil(
    filteredIncidents.length / itemsPerPage
  );

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const paginatedIncidents =
    filteredIncidents.slice(
      startIndex,
      startIndex + itemsPerPage
    );

  const handlePrevious = () => {
    setCurrentPage((page) =>
      Math.max(1, page - 1)
    );
  };

  const handleNext = () => {
    setCurrentPage((page) =>
      Math.min(totalPages, page + 1)
    );
  };

  /* ---------------- SELECTION ---------------- */

  const toggleIncidentSelection = (
    id: string
  ) => {
    setSelectedIncidents((current) =>
      current.includes(id)
        ? current.filter(
            (selectedId) => selectedId !== id
          )
        : [...current, id]
    );
  };

  const toggleSelectAll = () => {
    const filteredIds =
      filteredIncidents.map(
        (incident) => incident.id
      );

    const allSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) =>
        selectedIncidents.includes(id)
      );

    if (allSelected) {
      setSelectedIncidents((current) =>
        current.filter(
          (id) => !filteredIds.includes(id)
        )
      );
    } else {
      setSelectedIncidents((current) => [
        ...new Set([
          ...current,
          ...filteredIds,
        ]),
      ]);
    }
  };

  const allFilteredSelected =
    filteredIncidents.length > 0 &&
    filteredIncidents.every((incident) =>
      selectedIncidents.includes(incident.id)
    );

  /* ---------------- CREATE INCIDENT ---------------- */

  const openNewIncidentForm = () => {
    setNewSummary("");
    setNewCategory("Network");
    setNewAgent(agents[0]);
    setNewPriority("Medium");
    setCreateError("");
    setShowNewIncidentForm(true);
  };

  const closeNewIncidentForm = () => {
    setNewSummary("");
    setNewCategory("Network");
    setNewAgent(agents[0]);
    setNewPriority("Medium");
    setCreateError("");
    setShowNewIncidentForm(false);
  };

  const handleCreateIncident = () => {
    if (!newSummary.trim()) {
      setCreateError(
        "Please enter an incident summary."
      );
      return;
    }

    const newIncident: Incident = {
      id: String(
        1000000 + incidents.length + 1
      ),
      sla: "10:00",
      summary: newSummary.trim(),
      category: newCategory,
      agent: newAgent,
      priority: newPriority,
      status: "New",
      type: "Incident",
    };

    setIncidents((current) => [
      newIncident,
      ...current,
    ]);

    setNewSummary("");
    setNewCategory("Network");
    setNewAgent(agents[0]);
    setNewPriority("Medium");
    setCreateError("");
    setShowNewIncidentForm(false);
    setCurrentPage(1);
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="team-incidents-page">

      {/* PAGE HEADER */}
      <div className="team-incidents-header">
        <div>
          <h1>Incidents by Team</h1>

          <p>
            {team} - {mode}
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <TeamIncidentFilters
        search={search}
        setSearch={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
        status={status}
        setStatus={(value) => {
          setStatus(value);
          setCurrentPage(1);
        }}
        priority={priority}
        setPriority={(value) => {
          setPriority(value);
          setCurrentPage(1);
        }}
      />

      {/* INCIDENT TABLE */}
      <div className="incident-table-container">

        {/* TOOLBAR */}
        <div className="incident-table-toolbar">

          <div className="incident-toolbar-left">
            <span className="incident-title">
              Open Incidents
            </span>
          </div>

          <div className="incident-toolbar-right">

            <Pagination
              currentRange={
                filteredIncidents.length > 0
                  ? `${startIndex + 1}-${Math.min(
                      startIndex + itemsPerPage,
                      filteredIncidents.length
                    )} of ${
                      filteredIncidents.length
                    }`
                  : "0 of 0"
              }
              hasPrevious={currentPage > 1}
              hasNext={currentPage < totalPages}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />

            <button
              type="button"
              className="new-incident-button"
              onClick={openNewIncidentForm}
            >
              + New
            </button>

          </div>
        </div>

        {/* CREATE INCIDENT MODAL */}
        {showNewIncidentForm && (
          <div className="new-incident-overlay">

            <div className="new-incident-modal">

              <div className="new-incident-modal-header">

                <h2>
                  Create New Incident
                </h2>

                <button
                  type="button"
                  className="close-button"
                  onClick={closeNewIncidentForm}
                  aria-label="Close"
                >
                  ×
                </button>

              </div>

              <div className="new-incident-modal-body">

                {/* SUMMARY */}
                <label htmlFor="incident-summary">
                  Incident Summary
                </label>

                <input
                  id="incident-summary"
                  type="text"
                  placeholder="Enter incident summary"
                  value={newSummary}
                  onChange={(event) => {
                    setNewSummary(
                      event.target.value
                    );
                    setCreateError("");
                  }}
                />

                {/* CATEGORY */}
                <label htmlFor="incident-category">
                  Category
                </label>

                <select
                  id="incident-category"
                  value={newCategory}
                  onChange={(event) =>
                    setNewCategory(
                      event.target.value
                    )
                  }
                >
                  <option value="Network">
                    Network
                  </option>

                  <option value="Security">
                    Security
                  </option>

                  <option value="Office Applications">
                    Office Applications
                  </option>

                  <option value="Collaboration Tools">
                    Collaboration Tools
                  </option>
                </select>

                {/* AGENT */}
                <label htmlFor="incident-agent">
                  Agent
                </label>

                <select
                  id="incident-agent"
                  value={newAgent}
                  onChange={(event) =>
                    setNewAgent(
                      event.target.value
                    )
                  }
                >
                  {agents.map((agent) => (
                    <option
                      key={agent}
                      value={agent}
                    >
                      {agent}
                    </option>
                  ))}
                </select>

                {/* PRIORITY */}
                <label htmlFor="incident-priority">
                  Priority
                </label>

                <select
                  id="incident-priority"
                  value={newPriority}
                  onChange={(event) =>
                    setNewPriority(
                      event.target.value
                    )
                  }
                >
                  <option value="Critical">
                    Critical
                  </option>

                  <option value="High">
                    High
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="Low">
                    Low
                  </option>
                </select>

                {createError && (
                  <p className="create-error">
                    {createError}
                  </p>
                )}

              </div>

              <div className="new-incident-modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeNewIncidentForm}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="create-incident-button"
                  onClick={handleCreateIncident}
                >
                  Create Incident
                </button>

              </div>

            </div>

          </div>
        )}

        {/* TABLE */}
        <table className="incident-table">

          <thead>
            <tr>

              <th>
                <input
                  type="checkbox"
                  aria-label="Select all incidents"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                />
              </th>

              <th>Viewing</th>
              <th>ID</th>
              <th>SLA Time Left</th>
              <th>Summary</th>
              <th>Category</th>
              <th>Agent</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Type</th>

            </tr>
          </thead>

          <tbody>

            {paginatedIncidents.length > 0 ? (
              paginatedIncidents.map(
                (incident) => (
                  <tr
                    key={incident.id}
                    onClick={() =>
                      setSelectedIncident(
                        incident
                      )
                    }
                    style={{
                      cursor: "pointer",
                    }}
                  >

                    {/* CHECKBOX */}
                    <td
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select ${incident.id}`}
                        checked={selectedIncidents.includes(
                          incident.id
                        )}
                        onChange={() =>
                          toggleIncidentSelection(
                            incident.id
                          )
                        }
                      />
                    </td>

                    {/* VIEWING */}
                    <td>
                      <span
                        className="viewing-indicator"
                        aria-label="Currently viewing"
                      >
                        ●
                      </span>
                    </td>

                    {/* ID */}
                    <td>
                      {incident.id}
                    </td>

                    {/* SLA */}
                    <td>
                      <SLAIndicator
                        time={incident.sla}
                      />
                    </td>

                    {/* SUMMARY */}
                    <td>
                      {incident.summary}
                    </td>

                    {/* CATEGORY */}
                    <td>
                      {incident.category}
                    </td>

                    {/* AGENT */}
                    <td>
                      {incident.agent}
                    </td>

                    {/* PRIORITY */}
                    <td>
                      <PriorityIndicator
                        priority={
                          incident.priority
                        }
                      />
                    </td>

                    {/* STATUS */}
                    <td>
                      <span
                        className={`status status-${incident.status
                          .toLowerCase()
                          .replace(
                            /\s+/g,
                            "-"
                          )}`}
                      >
                        {incident.status}
                      </span>
                    </td>

                    {/* TYPE */}
                    <td>
                      {incident.type}
                    </td>

                  </tr>
                )
              )
            ) : (
              <tr>
                <td
                  colSpan={10}
                  className="empty-state"
                >
                  No incidents found.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

      {/* INCIDENT DETAILS */}
      {selectedIncident && (
        <div className="incident-details-panel">

          <div className="incident-details-header">

            <h2>
              Incident Details
            </h2>

            <button
              type="button"
              onClick={() =>
                setSelectedIncident(null)
              }
            >
              Close
            </button>

          </div>

          <p>
            <strong>ID:</strong>{" "}
            {selectedIncident.id}
          </p>

          <p>
            <strong>Summary:</strong>{" "}
            {selectedIncident.summary}
          </p>

          <p>
            <strong>Category:</strong>{" "}
            {selectedIncident.category}
          </p>

          <p>
            <strong>Agent:</strong>{" "}
            {selectedIncident.agent}
          </p>

          <p>
            <strong>Priority:</strong>{" "}
            {selectedIncident.priority}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {selectedIncident.status}
          </p>

          <p>
            <strong>SLA Time:</strong>{" "}
            {selectedIncident.sla}
          </p>

          <p>
            <strong>Type:</strong>{" "}
            {selectedIncident.type}
          </p>

          <p>
            <strong>Team:</strong>{" "}
            {team}
          </p>

        </div>
      )}

    </div>
  );
}

export default TeamIncidentTable;