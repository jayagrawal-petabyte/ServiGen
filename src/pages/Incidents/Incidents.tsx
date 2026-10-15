import {
  useMemo,
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
} from "react";
import "./Incidents.css";
import { usePersistentState } from "../../utils/persistentState";

import PriorityChart from "./PriorityChart";
import CategoryChart from "./CategoryChart";
import RecentIncidents from "./RecentIncidents";
import NewTickets from "./NewTickets";
import StatisticsCards from "./StatisticsCards";
import AllIncidentsModal from "./AllIncidentsModal";

import {
  CATEGORY_DATA,
  NEW_TICKETS,
  PRIORITY_DATA,
  RECENT_INCIDENTS,
  type RecentIncident,
  type NewTicket,
  type Priority,
} from "./incidents.data";

export interface IncidentNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  priority?: "Critical" | "High" | "Medium" | "Low";
}

export interface IncidentActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "status" | "assigned" | "created" | "resolved";
}

const INITIAL_NOTIFICATIONS: IncidentNotification[] = [
  {
    id: "NOTIF-1",
    title: "SLA Breach Warning: #0003987",
    description: "Desktop blue screen incident approaching SLA threshold.",
    time: "4m ago",
    isRead: false,
    priority: "Critical",
  },
  {
    id: "NOTIF-2",
    title: "Incident Reassigned: #0003982",
    description: "Monthly reporting query moved to 1st Line Support queue.",
    time: "22m ago",
    isRead: false,
    priority: "High",
  },
  {
    id: "NOTIF-3",
    title: "Major Incident Alert: #0002673-P",
    description: "System Login Failure confirmed as critical active incident.",
    time: "1h ago",
    isRead: false,
    priority: "Critical",
  },
  {
    id: "NOTIF-4",
    title: "Ticket Resolved: #0003012",
    description: "External monitor request fulfilled by Durgesh Kumar.",
    time: "3h ago",
    isRead: true,
    priority: "Low",
  },
];

const INITIAL_ACTIVITIES: IncidentActivity[] = [
  {
    id: "ACT-1",
    user: "Inesh Agarwal",
    action: "updated status of",
    target: "#0002673-P (System Login Failure)",
    time: "Just now",
    type: "status",
  },
  {
    id: "ACT-2",
    user: "Durgesh Kumar",
    action: "resolved service request",
    target: "#0003012 (External monitor)",
    time: "24m ago",
    type: "resolved",
  },
  {
    id: "ACT-3",
    user: "Anjali Prasad",
    action: "approved display name change on",
    target: "#0003013",
    time: "48m ago",
    type: "status",
  },
  {
    id: "ACT-4",
    user: "Mohammad Taha Ali",
    action: "assigned hardware request",
    target: "#0003009",
    time: "2h ago",
    type: "assigned",
  },
  {
    id: "ACT-5",
    user: "System Automation",
    action: "logged automated backup incident",
    target: "#0003132-C",
    time: "4h ago",
    type: "created",
  },
];

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
  const [showAllIncidentsModal, setShowAllIncidentsModal] =
    useState(false);

  const [activeFlyout, setActiveFlyout] = useState<"notifications" | "activity" | null>(null);
  const [notifications, setNotifications] = usePersistentState<IncidentNotification[]>(
    "servigen_incident_notifications_v1",
    INITIAL_NOTIFICATIONS
  );
  const [activities, setActivities] = usePersistentState<IncidentActivity[]>(
    "servigen_incident_activities_v1",
    INITIAL_ACTIVITIES
  );
  const flyoutRef = useRef<HTMLDivElement>(null);

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
        setActiveFlyout(null);
      }
    }
    if (activeFlyout) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeFlyout]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const toggleNotifRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const [tickets, setTickets] = usePersistentState<NewTicket[]>(
    "servigen_incidents_new_tickets_v1",
    NEW_TICKETS
  );
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

    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString("en-US", { month: "short" })} ${now.getFullYear()}, ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

    const newTicket: NewTicket = {
      id: `#${Math.floor(1000 + Math.random() * 9000)}`,
      type: newTicketType,
      summary: newSummary.trim(),
      description: newDescription.trim(),
      agent: "Unassigned",
      priority: newPriority,
      status: "Open",
      requester: "Inesh Agarwal (ServiGen User)",
      department: "IT Operations",
      category: newTicketType === "Incident" ? "Incident > General" : "Service Request > General",
      createdAt: formattedDate,
      targetSla: "Target SLA: Within 4 hours",
      notes: [
        {
          id: `n-${Date.now()}`,
          author: "Inesh Agarwal",
          time: "Just now",
          text: `Ticket created with summary: "${newSummary.trim()}".`,
        },
      ],
    };

    setTickets((prev) => [newTicket, ...prev]);

    const newAct: IncidentActivity = {
      id: `ACT-${Date.now()}`,
      user: "Inesh Agarwal",
      action: "created new ticket",
      target: `${newTicket.id} (${newTicket.summary})`,
      time: "Just now",
      type: "created",
    };
    setActivities((prev) => [newAct, ...prev]);

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

          {/* Notifications Button & Flyout */}
          <div className="header-icon-popover-wrap" ref={activeFlyout === "notifications" ? flyoutRef : undefined}>
            <button
              type="button"
              className={`header-icon-button ${activeFlyout === "notifications" ? "active" : ""}`}
              onClick={() => setActiveFlyout((p) => (p === "notifications" ? null : "notifications"))}
              aria-label="Notifications"
              title="Incident Notifications"
            >
              ♧
              {unreadNotifCount > 0 && (
                <span className="header-icon-badge">{unreadNotifCount}</span>
              )}
            </button>

            {activeFlyout === "notifications" && (
              <div className="header-flyout-menu">
                <div className="header-flyout-header">
                  <span className="header-flyout-title">
                    <span>Notifications</span>
                    {unreadNotifCount > 0 && <span>({unreadNotifCount} unread)</span>}
                  </span>
                  {unreadNotifCount > 0 && (
                    <button
                      type="button"
                      className="header-flyout-action"
                      onClick={markAllRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="header-flyout-list">
                  {notifications.length === 0 ? (
                    <div className="header-flyout-empty">No notifications</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`header-flyout-item ${!notif.isRead ? "unread" : ""}`}
                        onClick={() => toggleNotifRead(notif.id)}
                        title="Click to toggle read status"
                      >
                        <div className="header-flyout-item-top">
                          <span className="header-flyout-item-title">{notif.title}</span>
                          <span className="header-flyout-item-time">{notif.time}</span>
                        </div>
                        <p className="header-flyout-item-desc">{notif.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Activity Stream Button & Flyout */}
          <div className="header-icon-popover-wrap" ref={activeFlyout === "activity" ? flyoutRef : undefined}>
            <button
              type="button"
              className={`header-icon-button ${activeFlyout === "activity" ? "active" : ""}`}
              onClick={() => setActiveFlyout((p) => (p === "activity" ? null : "activity"))}
              aria-label="Activity"
              title="Incident Audit & Activity Stream"
            >
              ◷
            </button>

            {activeFlyout === "activity" && (
              <div className="header-flyout-menu">
                <div className="header-flyout-header">
                  <span className="header-flyout-title">
                    <span>Audit & Activity Stream</span>
                  </span>
                  <span className="header-flyout-item-time">Live Log</span>
                </div>

                <div className="header-flyout-list">
                  {activities.length === 0 ? (
                    <div className="header-flyout-empty">No recent activity</div>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="header-flyout-item">
                        <div className="header-flyout-item-top">
                          <span className="header-flyout-item-title">{act.user}</span>
                          <span className="header-flyout-item-time">{act.time}</span>
                        </div>
                        <p className="header-flyout-item-desc">
                          {act.action} <strong>{act.target}</strong>
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
            onViewAll={() => setShowAllIncidentsModal(true)}
          />

          <CategoryChart data={CATEGORY_DATA} />

          <NewTickets
            tickets={filteredTickets}
            onUpdateTickets={setTickets}
          />
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

      {/* All Incidents Expanded Paginated Modal */}
      <AllIncidentsModal
        isOpen={showAllIncidentsModal}
        onClose={() => setShowAllIncidentsModal(false)}
        incidents={RECENT_INCIDENTS}
        onSelectIncident={(incident) => {
          setSelectedIncident(incident);
        }}
      />
    </main>
  );
}