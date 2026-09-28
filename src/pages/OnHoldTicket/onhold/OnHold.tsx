import React, { useState } from "react";
import "./OnHold.css";

/* ─────────────────────────── data ─────────────────────────── */

interface Ticket {
  id: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  org: string;
  summary: string;
  status: "On Hold" | "With Sup";
}

const INCIDENT_TICKETS: Ticket[] = [
  { id: "0003951", priority: "High",     org: "consultancy/EMEA/Liam O'Connor",          summary: "Got an email pretending to be f...",           status: "On Hold"  },
  { id: "0003926", priority: "Medium",   org: "consultancy/EMEA/James Brown",             summary: "Getting a file size error trying to ...",       status: "With Sup" },
  { id: "0003841", priority: "Medium",   org: "consultancy/EMEA/Kaleem Smith",            summary: "VPN connects for a few second...",              status: "With Sup" },
  { id: "0003816", priority: "Critical", org: "consultancy/Americas/Fatima Al-Mans...",   summary: "Trading desk computer won't b...",              status: "With Sup" },
  { id: "0003801", priority: "High",     org: "consultancy/EMEA/Aisha Khan",              summary: "Teams meeting invites to exter...",             status: "With Sup" },
  { id: "0003701", priority: "Low",      org: "consultancy/Americas/Kwame Mensah",        summary: "Other people on Zoom calls say...",             status: "On Hold"  },
  { id: "0003693", priority: "Low",      org: "consultancy/EMEA/Liam O'Connor",           summary: "Computer has gotten noticeabl...",              status: "With Sup" },
  { id: "0003885", priority: "High",     org: "consultancy/APAC/Mateo Fernandez",         summary: "Nobody in customer support ca...",              status: "With Sup" },
  { id: "0003868", priority: "High",     org: "consultancy/Americas/Lucas Oliveira",      summary: "VPN disconnects constantly wh...",              status: "On Hold"  },
  { id: "0003637", priority: "Medium",   org: "consultancy/EMEA/Jennifer Williams",       summary: "Goals I set for this quarter neve...",          status: "With Sup" },
  { id: "0003549", priority: "Low",      org: "consultancy/EMEA/Kaleem Smith",            summary: "Getting a warning banner abou...",              status: "On Hold"  },
  { id: "0003450", priority: "High",     org: "consultancy/EMEA/James Brown",             summary: "Can't connect to a virtual mach...",            status: "With Sup" },
  { id: "0003373", priority: "Medium",   org: "consultancy/EMEA/Jennifer Williams",       summary: "Broke my phone screen, authen...",              status: "With Sup" },
  { id: "0003157", priority: "High",     org: "consultancy/APAC/John Smith",              summary: "Laptop battery percentage jum...",              status: "On Hold"  },
];

const SERVICE_TICKETS: Ticket[] = [
  { id: "0003947", priority: "Low", org: "consultancy/APAC/Diego Morales", summary: "Requesting approval to install p...", status: "With Sup" },
];

const PRIORITY_COLOR: Record<Ticket["priority"], string> = {
  Critical: "#ef4444",
  High:     "#f97316",
  Medium:   "#eab308",
  Low:      "#22c55e",
};

/* ─────────────────────────── sub-components ─────────────────── */

const NavSidebar: React.FC = () => (
  <aside className="oh-sidebar">
    <div className="oh-sidebar-logo">
      <div className="oh-logo-circle"></div>
    </div>
    <nav className="oh-sidebar-nav">
      {/* Dashboard */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
        </svg>
        <span className="oh-nav-label">Dashboard</span>
      </div>
      {/* My Work active */}
      <div className="oh-nav-item oh-nav-active">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
        </svg>
        <span className="oh-nav-label">My Work</span>
      </div>
      {/* Incidents */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
        </svg>
        <span className="oh-nav-label">Incidents</span>
      </div>
      {/* Major Incidents */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
        <span className="oh-nav-label oh-nav-label-sm">Major Incidents</span>
      </div>
      {/* Problems */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <span className="oh-nav-label">Problems</span>
      </div>
      {/* Requests */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-5 9H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V8h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V8h2v2z"/>
        </svg>
        <span className="oh-nav-label">Requests</span>
      </div>
      {/* Change Requests */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
        </svg>
        <span className="oh-nav-label oh-nav-label-sm">Change Requests</span>
      </div>
      {/* Projects */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
        <span className="oh-nav-label">Projects</span>
      </div>
      {/* Article Drafts */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
        <span className="oh-nav-label oh-nav-label-sm">Article Drafts</span>
      </div>
      {/* Calendar */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
        <span className="oh-nav-label">Calendar</span>
      </div>
      {/* Organisations */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M20 0H4v2h16V0zM4 24h16v-2H4v2zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25S13.24 11.25 12 11.25 9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/>
        </svg>
        <span className="oh-nav-label oh-nav-label-sm">Organisations</span>
      </div>
      {/* CMDB */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zm-2 6h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H8v-2h2v2zm10-11H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-2 6h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H8v-2h2v2zM4 1h16c.55 0 1 .45 1 1v3H3V2c0-.55.45-1 1-1z"/>
        </svg>
        <span className="oh-nav-label">CMDB</span>
      </div>
      {/* Contacts */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
        <span className="oh-nav-label">Contacts</span>
      </div>
      {/* My Approvals */}
      <div className="oh-nav-item">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span className="oh-nav-label oh-nav-label-sm">My Approvals</span>
      </div>
    </nav>
  </aside>
);

/* ─────────────────────────── Left Panel ─────────────────────── */

const VIEW_ITEMS = [
  { label: "My List",           icon: "list"   },
  { label: "Tickets by Agents", icon: "agent"  },
  { label: "Tickets by Team",   icon: "team"   },
  { label: "Tickets by Type",   icon: "type"   },
  { label: "Tickets by Status", icon: "status" },
  { label: "All Tickets",       icon: "search" },
] as const;

type ViewIcon = typeof VIEW_ITEMS[number]["icon"];

function renderViewIcon(icon: ViewIcon, active: boolean): React.ReactElement {
  const fill = active ? "white" : "#4a342c";
  const stroke = active ? "white" : "#4a342c";
  const p = { viewBox: "0 0 24 24", width: 16, height: 16, fill, style: { flexShrink: 0 as const } };
  
  switch (icon) {
    case "list":
      return <svg {...p}><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>;
    case "agent":
      return <svg {...p}><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>;
    case "team":
      return <svg {...p}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;
    case "type":
      return <span style={{ fontWeight: 700, fontSize: "13px", lineHeight: "1", color: fill, width: "16px", textAlign: "center", display: "inline-block", flexShrink: 0 }}>Aa</span>;
    case "status":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={stroke} strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={stroke} strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      );
  }
}

interface LeftPanelProps {
  search: string;
  setSearch: (v: string) => void;
  activeView: string;
  setActiveView: (v: string) => void;
  showSelectView: boolean;
  setShowSelectView: (v: boolean) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ search, setSearch, activeView, setActiveView, showSelectView, setShowSelectView }) => (
  <div className="oh-left-panel">
    {/* Pill Search bar */}
    <div className="oh-search-row">
      <input
        className="oh-search-input"
        type="text"
        placeholder="Search Tickets"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="oh-search-icon-btn">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#e8855e" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
    </div>

    {/* My List collapser row */}
    <div className="oh-mylist-row">
      <div className="oh-mylist-left">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="#4a342c">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
        </svg>
        <span className="oh-mylist-label">My List</span>
      </div>
      <button className="oh-collapse-btn" onClick={() => setShowSelectView(!showSelectView)}>«</button>
    </div>

    {/* Select the view panel */}
    {showSelectView && (
      <div className="oh-select-view-container">
        <div className="oh-select-view-header">
          <span className="oh-select-view-title">Select the view</span>
          <button className="oh-close-btn" onClick={() => setShowSelectView(false)}>✕</button>
        </div>
        <ul className="oh-view-list">
          {VIEW_ITEMS.map(({ label, icon }) => {
            const isActive = activeView === label;
            return (
              <li
                key={label}
                className={"oh-view-item" + (isActive ? " oh-view-item-active" : "")}
                onClick={() => setActiveView(label)}
              >
                {renderViewIcon(icon, isActive)}
                <span className="oh-view-item-label">{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    )}
  </div>
);

/* ─────────────────────────── Ticket Row ─────────────────────── */

interface RowProps {
  ticket: Ticket;
  selected: boolean;
  onToggle: () => void;
}

const TicketRow: React.FC<RowProps> = ({ ticket, selected, onToggle }) => (
  <tr className={"oh-row" + (selected ? " oh-row-selected" : "")}>
    <td className="oh-col-check">
      <input type="checkbox" checked={selected} onChange={onToggle}/>
    </td>
    <td className="oh-col-viewing">
      <span className="oh-viewing-dot" style={{ background: PRIORITY_COLOR[ticket.priority] }}/>
    </td>
    <td className="oh-col-id">
      <a href="#" className="oh-id-link" onClick={e => e.preventDefault()}>{ticket.id}</a>
    </td>
    <td className="oh-col-sla">
      <span className="oh-sla-text">On Hold</span>
    </td>
    <td className="oh-col-priority">
      <span className={`oh-priority-badge oh-priority-${ticket.priority.toLowerCase()}`}>
        <span className="oh-priority-dot-inner" style={{ background: PRIORITY_COLOR[ticket.priority] }}/>
        {ticket.priority}
      </span>
    </td>
    <td className="oh-col-org">
      <span className="oh-org-text">{ticket.org}</span>
    </td>
    <td className="oh-col-summary">{ticket.summary}</td>
    <td className="oh-col-status">
      {ticket.status === "On Hold"
        ? <span className="oh-status-badge oh-status-onhold">On Hold</span>
        : <span className="oh-status-badge oh-status-withsup">With Sup...</span>
      }
    </td>
  </tr>
);

/* ─────────────────────────── Main component ─────────────────── */

const OnHold: React.FC = () => {
  const [search, setSearch]                     = useState("");
  const [activeView, setActiveView]             = useState("My List");
  const [showSelectView, setShowSelectView]     = useState(true);
  const [incidentCollapsed, setIncidentCollapsed] = useState(false);
  const [serviceCollapsed, setServiceCollapsed]   = useState(false);
  const [selected, setSelected]                 = useState<string[]>([]);

  const filteredIncident = INCIDENT_TICKETS.filter(t =>
    t.id.includes(search) || t.org.toLowerCase().includes(search.toLowerCase()) || t.summary.toLowerCase().includes(search.toLowerCase())
  );
  const filteredService = SERVICE_TICKETS.filter(t =>
    t.id.includes(search) || t.org.toLowerCase().includes(search.toLowerCase()) || t.summary.toLowerCase().includes(search.toLowerCase())
  );

  const allIds = [...filteredIncident, ...filteredService].map(t => t.id);
  const toggle  = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => setSelected(e.target.checked ? allIds : []);

  const totalShown = filteredIncident.length + filteredService.length;

  return (
    <div className="oh-shell">
      {/* Left Sidebar */}
      <NavSidebar/>

      {/* Main area */}
      <div className="oh-main">

        {/* Top Navbar */}
        <header className="oh-topbar">
          <div className="oh-topbar-left">
            {/* breadcrumb */}
          </div>
          <div className="oh-topbar-center">
            <button className="oh-btn-get-started">Get started</button>
            <button className="oh-btn-new-ticket">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Ticket
            </button>
          </div>
          <div className="oh-topbar-right">
            <button className="oh-icon-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button className="oh-icon-btn oh-icon-btn-notif">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="oh-notif-dot">1</span>
            </button>
            <div className="oh-avatar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="oh-content-row">
          {/* Left Panel */}
          <LeftPanel
            search={search} setSearch={setSearch}
            activeView={activeView} setActiveView={setActiveView}
            showSelectView={showSelectView} setShowSelectView={setShowSelectView}
          />

          {/* Right Panel */}
          <div className="oh-right-panel">
            {/* Curvy Tab Stepper Shape on Table Card Header */}
            <div className="oh-tab-stepper" aria-hidden="true">
              <div className="oh-tab-step-curve">
                <svg width="28" height="14" viewBox="0 0 28 14" fill="none">
                  <path d="M 0,0 C 12,0 14,14 28,14 L 28,0 Z" fill="#f1f5f9" />
                </svg>
              </div>
              <div className="oh-tab-step-bar" />
            </div>

            {/* Table header row with escalation info */}
            <div className="oh-table-scroll">
              <table className="oh-table">
                <thead>
                  <tr className="oh-thead-row">
                    <th className="oh-col-check">
                      <input type="checkbox" onChange={toggleAll} checked={selected.length === allIds.length && allIds.length > 0}/>
                    </th>
                    <th className="oh-col-viewing">Viewing</th>
                    <th className="oh-col-id">ID</th>
                    <th className="oh-col-sla">SLA Time Left</th>
                    <th className="oh-col-priority">Priority</th>
                    <th className="oh-col-org">Organisation/Site/User</th>
                    <th className="oh-col-summary">Summary</th>
                    <th className="oh-col-status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Incident group */}
                  {filteredIncident.length > 0 && (
                    <>
                      <tr className="oh-group-row" onClick={() => setIncidentCollapsed(!incidentCollapsed)}>
                        <td colSpan={8}>
                          <div className="oh-group-bar">
                            <span className="oh-group-toggle">{incidentCollapsed ? "▶" : "▼"}</span>
                            <span className="oh-group-title">Incident</span>
                            <span className="oh-group-count">{filteredIncident.length}</span>
                            <span className="oh-group-note">Priority Escalations: 1 Critical, 5 Hi...</span>
                          </div>
                        </td>
                      </tr>
                      {!incidentCollapsed && filteredIncident.map(t => (
                        <TicketRow key={t.id} ticket={t} selected={selected.includes(t.id)} onToggle={() => toggle(t.id)}/>
                      ))}
                    </>
                  )}

                  {/* Service Request group */}
                  {filteredService.length > 0 && (
                    <>
                      <tr className="oh-group-row" onClick={() => setServiceCollapsed(!serviceCollapsed)}>
                        <td colSpan={8}>
                          <div className="oh-group-bar">
                            <span className="oh-group-toggle">{serviceCollapsed ? "▶" : "▼"}</span>
                            <span className="oh-group-title">Service Request</span>
                            <span className="oh-group-count">{filteredService.length}</span>
                            <span className="oh-group-note">Approval Workflows: 4 Pending Approva...</span>
                          </div>
                        </td>
                      </tr>
                      {!serviceCollapsed && filteredService.map(t => (
                        <TicketRow key={t.id} ticket={t} selected={selected.includes(t.id)} onToggle={() => toggle(t.id)}/>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="oh-footer">
              <span className="oh-footer-count">Showing 1 – {totalShown} of 22 items</span>
              <div className="oh-footer-rows">
                <span>Rows per page:</span>
                <select className="oh-rows-select" defaultValue="15">
                  <option>15</option><option>25</option><option>50</option>
                </select>
              </div>
              <div className="oh-footer-pages">
                <button className="oh-page-btn oh-page-btn-disabled" disabled>Previous</button>
                <button className="oh-page-btn oh-page-btn-active">1</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnHold;
