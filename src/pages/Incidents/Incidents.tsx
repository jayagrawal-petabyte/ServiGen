import { useMemo, useState, type ChangeEvent } from "react";
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
} from "./incidents.data";

type IncidentsProps = {
  isLoading?: boolean;
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
}: IncidentsProps) {
  const [search, setSearch] = useState("");
  const [selectedIncident, setSelectedIncident] =
    useState<RecentIncident | null>(null);

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
      return NEW_TICKETS;
    }

    return NEW_TICKETS.filter((ticket) => {
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
  }, [search]);

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSearch(event.target.value);
  };

  const clearSearch = () => {
    setSearch("");
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
    </main>
  );
}