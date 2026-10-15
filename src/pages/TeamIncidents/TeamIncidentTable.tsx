import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Pagination from "../../components/shared/Pagination";
import TeamIncidentFilters from "./TeamIncidentFilters";
import SLAIndicator from "./SLAIndicator";
import PriorityIndicator from "./PriorityIndicator";
import { useAuth } from "../Auth/AuthContext";
import { MOCK_ORGANISATION_USERS } from "../Auth/mockAuthData";
import { usePersistentState } from "../../utils/persistentState";
import { TicketDetailModal, type FullTicket, type TicketPriority } from "../../components/TicketDetailModal";
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

const agents = MOCK_ORGANISATION_USERS.map((u) => u.fullName);

function TeamIncidentTable({
  team,
  mode,
}: TeamIncidentTableProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [incidents, setIncidents] = usePersistentState<Incident[]>(
    `servigen_team_incidents_${team.toLowerCase().replace(/\s+/g, '_')}`,
    initialIncidents
  );

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
    useState(user?.fullName || agents[0]);

  const [newPriority, setNewPriority] =
    useState("Medium");

  const [createError, setCreateError] =
    useState("");

  const itemsPerPage = 10;

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

  /* ---------------- BULK ACTIONS ---------------- */

  const handleBulkAssignToMe = () => {
    const me = user?.fullName || "Inesh Agarwal";
    setIncidents((prev) =>
      prev.map((inc) =>
        selectedIncidents.includes(inc.id) ? { ...inc, agent: me } : inc
      )
    );
    setSelectedIncidents([]);
  };

  const handleBulkSetPriority = (newPrio: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        selectedIncidents.includes(inc.id) ? { ...inc, priority: newPrio } : inc
      )
    );
    setSelectedIncidents([]);
  };

  const handleBulkSetStatus = (newStat: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        selectedIncidents.includes(inc.id) ? { ...inc, status: newStat } : inc
      )
    );
    setSelectedIncidents([]);
  };

  const handleBulkClear = () => {
    setSelectedIncidents([]);
  };

  const handleModalUpdateTicket = (updated: FullTicket) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === updated.id
          ? {
              ...inc,
              agent: updated.agent,
              priority: updated.priority,
              status: updated.status || inc.status,
              summary: updated.summary,
              category: updated.category || inc.category,
              type: updated.type || inc.type,
            }
          : inc
      )
    );
    if (selectedIncident && selectedIncident.id === updated.id) {
      setSelectedIncident((curr) =>
        curr
          ? {
              ...curr,
              agent: updated.agent,
              priority: updated.priority,
              status: updated.status || curr.status,
              summary: updated.summary,
              category: updated.category || curr.category,
              type: updated.type || curr.type,
            }
          : null
      );
    }
  };

  /* ---------------- CREATE INCIDENT ---------------- */

  const openNewIncidentForm = () => {
    setNewSummary("");
    setNewCategory("Network");
    setNewAgent(user?.fullName || agents[0]);
    setNewPriority("Medium");
    setCreateError("");
    setShowNewIncidentForm(true);
  };

  const closeNewIncidentForm = () => {
    setNewSummary("");
    setNewCategory("Network");
    setNewAgent(user?.fullName || agents[0]);
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
      <div className="team-incidents-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Incidents by Team</h1>

          <p>
            {team} — {mode} Mode
          </p>
        </div>

        <div className="team-view-tabs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: '1st Line (Live)', path: '/team/1st-line-live' },
            { label: '1st Line (Design)', path: '/team/1st-line-design' },
            { label: '2nd Line (Live)', path: '/team/2nd-line-live' },
            { label: '2nd Line (Design)', path: '/team/2nd-line-design' },
          ].map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                type="button"
                onClick={() => navigate(tab.path)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? '#003c50' : '#ffffff',
                  color: isActive ? '#ffffff' : '#334155',
                  border: isActive ? '1px solid #003c50' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
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

        {/* BULK ACTIONS BAR */}
        {selectedIncidents.length > 0 && (
          <div className="tickets-bulk-actions-bar">
            <div className="bulk-selection-count">
              <span className="bulk-badge">{selectedIncidents.length}</span>
              <span>incident{selectedIncidents.length > 1 ? "s" : ""} selected</span>
            </div>

            <div className="bulk-actions-buttons">
              <button
                type="button"
                className="bulk-btn bulk-btn-assign"
                onClick={handleBulkAssignToMe}
                title={`Assign selected incidents to ${user?.fullName || "Inesh Agarwal"}`}
              >
                Assign to Me
              </button>

              <div className="bulk-priority-dropdown-wrap">
                <select
                  className="bulk-select"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkSetPriority(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  aria-label="Set priority for selected incidents"
                >
                  <option value="" disabled>Set Priority ▾</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="bulk-priority-dropdown-wrap">
                <select
                  className="bulk-select"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkSetStatus(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  aria-label="Set status for selected incidents"
                >
                  <option value="" disabled>Set Status ▾</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Open">Open</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <button
                type="button"
                className="bulk-btn bulk-btn-clear"
                onClick={handleBulkClear}
              >
                Clear Selection
              </button>
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
                    className={selectedIncident?.id === incident.id ? "row-viewing-active" : ""}
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
                      {selectedIncident?.id === incident.id ? (
                        <span
                          className="viewing-badge viewing-active"
                          title="Currently open in details view"
                        >
                          <span className="viewing-icon">👁</span>
                          <span>You</span>
                        </span>
                      ) : (
                        <span className="viewing-dash" title="Not currently open in details view">
                          —
                        </span>
                      )}
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

      {/* INCIDENT DETAILS MODAL */}
      {selectedIncident && (
        <TicketDetailModal
          ticket={{
            id: selectedIncident.id,
            type: selectedIncident.type,
            summary: selectedIncident.summary,
            agent: selectedIncident.agent,
            priority: (selectedIncident.priority as TicketPriority) || "Medium",
            status: selectedIncident.status,
            category: selectedIncident.category,
            targetSla: `Target SLA: ${selectedIncident.sla}`,
          }}
          currentUser={user?.fullName || "Inesh Agarwal"}
          onClose={() => setSelectedIncident(null)}
          onUpdateTicket={handleModalUpdateTicket}
        />
      )}

    </div>
  );
}

export default TeamIncidentTable;