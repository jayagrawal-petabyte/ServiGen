import {
  useMemo,
  useState,
  type ChangeEvent,
} from "react";

import "./Incidents.css";

import PriorityChart from "./PriorityChart";
import CategoryChart from "./CategoryChart";
import RecentIncidents from "./RecentIncidents";
import NewTickets from "./NewTickets";

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

export default function Incidents({
  isLoading = false,
}: IncidentsProps) {
  const [query, setQuery] = useState<string>("");

  const [selectedIncident, setSelectedIncident] =
    useState<RecentIncident | null>(null);


  const filteredIncidents = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (search === "") {
      return RECENT_INCIDENTS;
    }

    return RECENT_INCIDENTS.filter(
      (incident: RecentIncident) => {
        return (
          incident.id
            .toLowerCase()
            .indexOf(search) !== -1 ||
          incident.subject
            .toLowerCase()
            .indexOf(search) !== -1 ||
          incident.priority
            .toLowerCase()
            .indexOf(search) !== -1 ||
          incident.status
            .toLowerCase()
            .indexOf(search) !== -1 ||
          incident.date
            .toLowerCase()
            .indexOf(search) !== -1
        );
      }
    );
  }, [query]);



  const filteredTickets = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (search === "") {
      return NEW_TICKETS;
    }

    return NEW_TICKETS.filter((ticket) => {
      return (
        ticket.id
          .toLowerCase()
          .indexOf(search) !== -1 ||
        ticket.type
          .toLowerCase()
          .indexOf(search) !== -1 ||
        ticket.summary
          .toLowerCase()
          .indexOf(search) !== -1 ||
        ticket.category
          .toLowerCase()
          .indexOf(search) !== -1 ||
        ticket.priority
          .toLowerCase()
          .indexOf(search) !== -1 ||
        ticket.status
          .toLowerCase()
          .indexOf(search) !== -1
      );
    });
  }, [query]);


  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setQuery(event.target.value);
  };

  const clearSearch = () => {
    setQuery("");
  };

  return (
    <main className="incidents-page">


      <header className="incidents-header">
        <div className="incidents-heading">
          <h1>Incidents</h1>

          <p>
            Monitor and manage reported incidents
          </p>
        </div>

        <div className="incidents-header-actions">
          {/* Search */}
          <div className="incidents-search">
            <span
              className="incidents-search-icon"
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder="Search..."
              aria-label="Search incidents"
            />

            {query !== "" && (
              <button
                type="button"
                className="search-clear-button"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

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
            aria-label="Help"
          >
            ?
          </button>

          {}
          <button
            type="button"
            className="new-ticket-button"
          >
            + New Ticket
          </button>
        </div>
      </header>


      {isLoading ? (
        <div className="incidents-grid">
          <section className="incident-card incident-loading-card">
            Loading incident analytics...
          </section>

          <section className="incident-card incident-loading-card">
            Loading recent incidents...
          </section>

          <section className="incident-card incident-loading-card">
            Loading category information...
          </section>

          <section className="incident-card incident-loading-card">
            Loading new tickets...
          </section>
        </div>
      ) : (

        <div className="incidents-grid">
          {/* Top Left */}
          <PriorityChart data={PRIORITY_DATA} />

          {}
          <RecentIncidents
            incidents={filteredIncidents}
            onSelectIncident={setSelectedIncident}
          />

          {}
          <CategoryChart data={CATEGORY_DATA} />


          <NewTickets tickets={filteredTickets} />
        </div>
      )}

      {selectedIncident && (
        <div
          className="incident-modal-overlay"
          onClick={() =>
            setSelectedIncident(null)
          }
          role="presentation"
        >
          <section
            className="incident-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="incident-details-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {}
            <button
              type="button"
              className="incident-modal-close"
              onClick={() =>
                setSelectedIncident(null)
              }
              aria-label="Close incident details"
            >
              ×
            </button>

            {}
            <div className="incident-modal-header">
              <span className="incident-modal-id">
                {selectedIncident.id}
              </span>

              <h2 id="incident-details-title">
                {selectedIncident.subject}
              </h2>
            </div>

            {}
            <div className="incident-modal-badges">
              <span
                className={`incident-pill priority-${selectedIncident.priority.toLowerCase()}`}
              >
                {selectedIncident.priority}
              </span>

              <span
                className={`incident-pill ${
                  selectedIncident.status ===
                  "In Progress"
                    ? "status-progress"
                    : selectedIncident.status === "Open"
                    ? "status-open"
                    : selectedIncident.status ===
                      "Resolved"
                    ? "status-resolved"
                    : "status-hold"
                }`}
              >
                {selectedIncident.status}
              </span>
            </div>

            {}
            <div className="incident-details-grid">
              <div className="incident-detail-item">
                <span>Organisation</span>

                <strong>
                  {selectedIncident.organisation}
                </strong>
              </div>

              <div className="incident-detail-item">
                <span>Assigned To</span>

                <strong>
                  {selectedIncident.assignedTo}
                </strong>
              </div>

              <div className="incident-detail-item">
                <span>Priority</span>

                <strong>
                  {selectedIncident.priority}
                </strong>
              </div>

              <div className="incident-detail-item">
                <span>Date</span>

                <strong>
                  {selectedIncident.date}
                </strong>
              </div>
            </div>

            {}
            <div className="incident-description">
              <span>Description</span>

              <p>
                {selectedIncident.description}
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}