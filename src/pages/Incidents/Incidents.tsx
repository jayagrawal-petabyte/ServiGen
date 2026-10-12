import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import "./Incidents.css";

import PriorityChart from "./PriorityChart";
import CategoryChart from "./CategoryChart";
import RecentIncidents from "./RecentIncidents";
import NewTickets from "./NewTickets";
import StatisticsCards from "./StatisticsCards";

import {
  CATEGORY_DATA,
  NEW_TICKETS,
  PRIORITY_DATA,
  RECENT_INCIDENTS,
  type RecentIncident,
  type NewTicket,
  type Priority,
} from "./incidents.data";

type IncidentsProps = {
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
};

function getStatusClass(status: RecentIncident["status"]): string {
  if (status === "In Progress") {
    return "status-progress";
  }

  if (status === "Open") {
    return "status-open";
  }

  if (status === "Resolved") {
    return "status-resolved";
  }

  return "status-hold";
}

export default function Incidents({
  isLoading = false,
  isEmpty = false,
  isError = false,
}: IncidentsProps) {
  const [search, setSearch] = useState("");
  const [selectedIncident, setSelectedIncident] =
    useState<RecentIncident | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] =
    useState(false);

  const [tickets, setTickets] = useState<NewTicket[]>(NEW_TICKETS);
  const [newTicketType, setNewTicketType] = useState<"Incident" | "Service Request">("Incident");
  const [newSummary, setNewSummary] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("Medium");

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return RECENT_INCIDENTS;
    }

    return RECENT_INCIDENTS.filter((incident) => {
      const searchableText = [
        incident.id,
        incident.subject,
        incident.priority,
        incident.status,
        incident.assignedTo,
        incident.organisation,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.indexOf(query) !== -1;
    });
  }, [search]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return tickets;
    }

    return tickets.filter((ticket) => {
      const searchableText = [
        ticket.id,
        ticket.type,
        ticket.summary,
        ticket.agent,
        ticket.priority,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.indexOf(query) !== -1;
    });
  }, [search, tickets]);

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSearch(event.target.value);
  };

  const clearSearch = () => {
    setSearch("");
  };

  const handleCreateTicket = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!newSummary.trim()) return;

    const newTicket: NewTicket = {
      id: `#${Math.floor(1000 + Math.random() * 9000)}`,
      type: newTicketType,
      summary: newSummary.trim(),
      agent: "Unassigned",
      priority: newPriority,
    };

    setTickets((prev) => [newTicket, ...prev]);
    setNewSummary("");
    setNewDescription("");
    setShowNewTicketModal(false);
  };

  return (
    <main className="incidents-page">
      <header className="incidents-header">
        <div className="incidents-heading">
          <h1>Incidents</h1>
          <p>Monitor and manage reported incidents</p>
        </div>

        <div className="incidents-header-actions">
          <label className="incidents-search">
            <span className="incidents-search-icon">⌕</span>

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search incidents"
              aria-label="Search incidents"
            />

            {search && (
              <button
                type="button"
                className="search-clear-button"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>

          <button
            type="button"
            className="header-icon-button"
            aria-label="Notifications"
          >
            ♧
          </button>

          <button
            type="button"
            className="header-icon-button"
            aria-label="Activity"
          >
            ◷
          </button>

          <button
            type="button"
            className="new-ticket-button"
            onClick={() => setShowNewTicketModal(true)}
          >
            + New Ticket
          </button>
        </div>
      </header>

      <StatisticsCards />

      {isLoading ? (
        <div className="incidents-grid">
          <div className="incident-card incident-loading-card">
            Loading incidents...
          </div>

          <div className="incident-card incident-loading-card">
            Loading recent incidents...
          </div>

          <div className="incident-card incident-loading-card">
            Loading categories...
          </div>

          <div className="incident-card incident-loading-card">
            Loading new tickets...
          </div>
        </div>
      ) : isError ? (
        <div className="incident-card incident-state-card">
          <strong>Unable to load incidents</strong>
          <span>Please try again later.</span>
        </div>
      ) : isEmpty ? (
        <div className="incident-card incident-state-card">
          <strong>No incidents found</strong>
          <span>
            There are currently no incidents to display.
          </span>
        </div>
      ) : (
        <div className="incidents-grid">
          <PriorityChart data={PRIORITY_DATA} />

          <RecentIncidents
            incidents={filteredIncidents}
            onSelectIncident={setSelectedIncident}
          />

          <CategoryChart data={CATEGORY_DATA} />

          <NewTickets tickets={filteredTickets} />
        </div>
      )}

      {selectedIncident && (
        <div
          className="incident-modal-overlay"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="incident-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="incident-modal-close"
              onClick={() => setSelectedIncident(null)}
              aria-label="Close incident details"
            >
              ×
            </button>

            <div className="incident-modal-header">
              <span className="incident-modal-id">
                {selectedIncident.id}
              </span>

              <h2>{selectedIncident.subject}</h2>

              <div className="incident-modal-badges">
                <span
                  className={`incident-pill priority-${selectedIncident.priority.toLowerCase()}`}
                >
                  {selectedIncident.priority}
                </span>

                <span
                  className={`incident-pill ${getStatusClass(
                    selectedIncident.status
                  )}`}
                >
                  {selectedIncident.status}
                </span>
              </div>
            </div>

            <div className="incident-details-grid">
              <div className="incident-detail-item">
                <span>Assigned To</span>
                <strong>
                  {selectedIncident.assignedTo}
                </strong>
              </div>

              <div className="incident-detail-item">
                <span>Organisation</span>
                <strong>
                  {selectedIncident.organisation}
                </strong>
              </div>

              <div className="incident-detail-item">
                <span>Date</span>
                <strong>{selectedIncident.date}</strong>
              </div>

              <div className="incident-detail-item">
                <span>Status</span>
                <strong>{selectedIncident.status}</strong>
              </div>
            </div>

            <div className="incident-description">
              <span>Description</span>
              <p>{selectedIncident.description}</p>
            </div>
          </div>
        </div>
      )}

      {showNewTicketModal && (
        <div
          className="new-ticket-modal-overlay"
          onClick={() => setShowNewTicketModal(false)}
        >
          <div
            className="new-ticket-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="new-ticket-modal-header">
              <h2>New Ticket</h2>

              <button
                type="button"
                className="new-ticket-modal-close"
                onClick={() => setShowNewTicketModal(false)}
                aria-label="Close new ticket form"
              >
                ×
              </button>
            </div>

            <form
              className="new-ticket-form"
              onSubmit={handleCreateTicket}
            >
              <label>
                Ticket Type
                <select
                  value={newTicketType}
                  onChange={(e) => setNewTicketType(e.target.value as "Incident" | "Service Request")}
                >
                  <option value="Incident">Incident</option>
                  <option value="Service Request">
                    Service Request
                  </option>
                </select>
              </label>

              <label>
                Summary
                <input
                  type="text"
                  placeholder="Enter ticket summary"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  rows={4}
                  placeholder="Enter ticket description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                />
              </label>

              <label>
                Priority
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </label>

              <div className="new-ticket-form-actions">
                <button
                  type="button"
                  className="new-ticket-cancel"
                  onClick={() => setShowNewTicketModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="new-ticket-submit"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}