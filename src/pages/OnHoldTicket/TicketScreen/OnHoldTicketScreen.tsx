import React, { useState } from "react";
import "./OnHoldTicketScreen.css";
import Sidebar from "../sidebar/Sidebar";
import MyList from "../mylist/MyList";
import Agent from "../mylist/agent/Agent";
import Team from "../mylist/team/Team";
import Type from "../mylist/type/Type";
import Status from "../mylist/status/Status";

interface Ticket {
  id: string;
  priority: string;
  priorityColor: "red" | "orange" | "yellow" | "green";
  org: string;
  summary: string;
  status: "On H" | "With";
}

const INCIDENT_TICKETS: Ticket[] = [
  { id: "0003951", priority: "High",     priorityColor: "orange", org: "consultancy/EMEA/Liam O'Connor",       summary: "Got an email pretending to be f...", status: "On H" },
  { id: "0003926", priority: "Medium",   priorityColor: "yellow", org: "consultancy/EMEA/James Brown",         summary: "Getting a file size error trying to ...", status: "With" },
  { id: "0003841", priority: "Medium",   priorityColor: "yellow", org: "consultancy/EMEA/Kaleem Smith",        summary: "VPN connects for a few second...", status: "With" },
  { id: "0003816", priority: "Critical", priorityColor: "red",    org: "consultancy/Americas/Fatima Al-Mans...",summary: "Trading desk computer won't b...", status: "With" },
  { id: "0003801", priority: "High",     priorityColor: "orange", org: "consultancy/EMEA/Aisha Khan",          summary: "Teams meeting invites to exter...", status: "With" },
  { id: "0003701", priority: "Low",      priorityColor: "green",  org: "consultancy/Americas/Kwame Mensah",   summary: "Other people on Zoom calls say...", status: "On H" },
  { id: "0003693", priority: "Low",      priorityColor: "green",  org: "consultancy/EMEA/Liam O'Connor",      summary: "Computer has gotten noticeabl...", status: "With" },
  { id: "0003885", priority: "High",     priorityColor: "orange", org: "consultancy/APAC/Mateo Fernandez",    summary: "Nobody in customer support ca...", status: "With" },
  { id: "0003868", priority: "High",     priorityColor: "orange", org: "consultancy/Americas/Lucas Oliveira", summary: "VPN disconnects constantly wh...", status: "On H" },
  { id: "0003637", priority: "Medium",   priorityColor: "yellow", org: "consultancy/EMEA/Jennifer Williams",  summary: "Goals I set for this quarter neve...", status: "With" },
  { id: "0003549", priority: "Low",      priorityColor: "green",  org: "consultancy/EMEA/Kaleem Smith",       summary: "Getting a warning banner abou...", status: "On H" },
  { id: "0003450", priority: "High",     priorityColor: "orange", org: "consultancy/EMEA/James Brown",        summary: "Can't connect to a virtual mach...", status: "With" },
  { id: "0003373", priority: "Medium",   priorityColor: "yellow", org: "consultancy/EMEA/Jennifer Williams",  summary: "Broke my phone screen, authen...", status: "With" },
  { id: "0003157", priority: "High",     priorityColor: "orange", org: "consultancy/APAC/John Smith",         summary: "Laptop battery percentage jum...", status: "On H" },
];

const SERVICE_TICKETS: Ticket[] = [
  { id: "0003947", priority: "Low", priorityColor: "green", org: "consultancy/APAC/Diego Morales", summary: "Requesting approval to install p...", status: "With" },
];

const PRIORITY_DOT: Record<Ticket["priorityColor"], string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
};

interface TicketRowProps {
  ticket: Ticket;
  selectedItems: string[];
  onToggle: (id: string) => void;
}

const TicketRow: React.FC<TicketRowProps> = ({ ticket, selectedItems, onToggle }) => (
  <tr className={"ticket-row" + (selectedItems.includes(ticket.id) ? " selected" : "")}>
    <td className="col-type">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#64748b" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M8 12h8M8 8h8M8 16h4" />
      </svg>
    </td>
    <td className="col-check">
      <input type="checkbox" checked={selectedItems.includes(ticket.id)} onChange={() => onToggle(ticket.id)} />
    </td>
    <td className="col-viewing">
      <span className="badge-onhold">On Hold</span>
    </td>
    <td className="col-id">
      <a href={`#ticket/${ticket.id}`} className="ticket-id-link" onClick={(e) => { e.preventDefault(); alert(`Navigating to details for Ticket: ${ticket.id}`); }}>
        {ticket.id}
      </a>
    </td>
    <td className="col-sla">
      <span className="sla-text">On Hold</span>
    </td>
    <td className="col-priority">
      <span className="priority-dot" style={{ backgroundColor: PRIORITY_DOT[ticket.priorityColor] }}></span>
      <span className="priority-label">{ticket.priority}</span>
    </td>
    <td className="col-org">
      <span className="org-link">{ticket.org}</span>
    </td>
    <td className="col-summary">{ticket.summary}</td>
    <td className="col-status">
      <span className={"status-badge " + (ticket.status === "On H" ? "status-cyan" : "status-teal")}>
        {ticket.status === "On H" ? "On H..." : "With..."}
      </span>
    </td>
  </tr>
);

const OnHoldTicketScreen: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [incidentCollapsed, setIncidentCollapsed] = useState<boolean>(false);
  const [serviceCollapsed, setServiceCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeView, setActiveView] = useState<string>("My Lists");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  React.useEffect(() => {
    // Simulate initial data fetching
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
      // setHasError(true); // Uncomment to test error state
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const filteredIncident = INCIDENT_TICKETS.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.org.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredService = SERVICE_TICKETS.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.org.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allIds = [...filteredIncident, ...filteredService].map((t) => t.id);

  const toggleSelect = (id: string): void =>
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>): void =>
    setSelectedItems(e.target.checked ? allIds : []);

  return (
    <div className="app-shell">
      {/* -- Left Sidebar -- */}
      <Sidebar />

      {/* -- Main Area -- */}
      <div className="main-area">

        {/* Top Nav */}
        <div className="top-navbar">
          <div className="topnav-left">
            <span className="breadcrumb">
              <span className="bc-item">Tickets</span>
              <span className="bc-sep">›</span>
              <span className="bc-active">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="#ef4444" style={{marginRight:5,flexShrink:0}}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                My On Hold Tickets
              </span>
            </span>
          </div>
          <div className="topnav-tab-bar">
            <span className="tab-plus">+</span>
          </div>
          <div className="topnav-right">
            <button className="btn-get-started">Get started</button>
            <button className="btn-new-ticket">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Ticket
            </button>
            <div className="topnav-icons">
              <button className="tnav-icon-btn">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
              <button className="tnav-icon-btn notif-wrap">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span className="notif-dot">1</span>
              </button>
              <button className="tnav-icon-btn">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              </button>
              <button className="tnav-icon-btn">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </button>
              <button className="tnav-icon-btn">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
            </div>
            <div className="user-avatar-circle">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="content-row">

          {/* Left Panel */}
          <MyList 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            activeView={activeView}
            setActiveView={setActiveView}
          />

          {/* Right Table */}
          {activeView === "Tickets by Agent" ? (
            <Agent />
          ) : activeView === "Tickets by Team" ? (
            <Team />
          ) : activeView === "Tickets by Type" ? (
            <Type />
          ) : activeView === "Tickets by Status" ? (
            <Status />
          ) : (
            <div className="right-panel">
              <div className="table-toolbar">
              <button className="tb-add-btn">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <div style={{flex:1}}></div>
              <span className="count-text">1-24 of 24</span>
              <button className="tb-nav-btn"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
              <button className="tb-nav-btn"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
              <button className="tb-nav-btn"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>
              <button className="btn-new-green">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New
              </button>
              <button className="tb-nav-btn"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
            </div>

            <div className="table-scroll-wrap">
              {isLoading ? (
                <div className="skeleton-container">
                  <table className="main-table skeleton-table">
                    <thead>
                      <tr>
                        <th className="col-type">Type</th>
                        <th className="col-check"></th>
                        <th className="col-viewing">Viewing</th>
                        <th className="col-id">ID</th>
                        <th className="col-sla">SLA Time Left</th>
                        <th className="col-priority">Priority</th>
                        <th className="col-org">Organisation/Site/User</th>
                        <th className="col-summary">Summary</th>
                        <th className="col-status">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <tr key={i} className="ticket-row skeleton-row">
                          <td className="col-type"><div className="skeleton-box type-skel"></div></td>
                          <td className="col-check"><div className="skeleton-box check-skel"></div></td>
                          <td className="col-viewing"><div className="skeleton-box view-skel"></div></td>
                          <td className="col-id"><div className="skeleton-box id-skel"></div></td>
                          <td className="col-sla"><div className="skeleton-box sla-skel"></div></td>
                          <td className="col-priority"><div className="skeleton-box pri-skel"></div></td>
                          <td className="col-org"><div className="skeleton-box org-skel"></div></td>
                          <td className="col-summary"><div className="skeleton-box sum-skel"></div></td>
                          <td className="col-status"><div className="skeleton-box stat-skel"></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : hasError ? (
                <div className="error-state">
                  <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="error-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <h3>Failed to load tickets</h3>
                  <p>There was a problem connecting to the server. Please try again.</p>
                  <button className="btn-retry" onClick={() => { setIsLoading(true); setHasError(false); setTimeout(() => setIsLoading(false), 1200); }}>Retry</button>
                </div>
              ) : filteredIncident.length === 0 && filteredService.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="empty-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <h3>No tickets found</h3>
                  <p>We couldn't find any on-hold tickets matching your criteria.</p>
                  {searchQuery && (
                    <button className="btn-clear-search" onClick={() => setSearchQuery("")}>
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <table className="main-table">
                  <thead>
                    <tr>
                      <th className="col-type">Type</th>
                      <th className="col-check"><input type="checkbox" onChange={toggleAll} checked={selectedItems.length === allIds.length && allIds.length > 0}/></th>
                      <th className="col-viewing">Viewing</th>
                      <th className="col-id">ID</th>
                      <th className="col-sla">SLA Time Left</th>
                      <th className="col-priority">Priority</th>
                      <th className="col-org">Organisation/Site/User</th>
                      <th className="col-summary">Summary</th>
                      <th className="col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncident.length > 0 && (
                      <tr className="group-header-row" onClick={() => setIncidentCollapsed(!incidentCollapsed)}>
                        <td colSpan={9}>
                          <span className="group-toggle">{incidentCollapsed ? "▶" : "▼"}</span>
                          <span className="group-title"> Incident ({filteredIncident.length})</span>
                        </td>
                      </tr>
                    )}
                    {!incidentCollapsed && filteredIncident.map((t) => <TicketRow key={t.id} ticket={t} selectedItems={selectedItems} onToggle={toggleSelect} />)}
  
                    {filteredService.length > 0 && (
                      <tr className="group-header-row" onClick={() => setServiceCollapsed(!serviceCollapsed)}>
                        <td colSpan={9}>
                          <span className="group-toggle">{serviceCollapsed ? "▶" : "▼"}</span>
                          <span className="group-title"> Service Request ({filteredService.length})</span>
                        </td>
                      </tr>
                    )}
                    {!serviceCollapsed && filteredService.map((t) => <TicketRow key={t.id} ticket={t} selectedItems={selectedItems} onToggle={toggleSelect} />)}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnHoldTicketScreen;
