import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./OnHoldTicketScreen.css";
import MyList from "../mylist/MyList";
import { TicketDetailModal, type FullTicket, type TicketPriority } from "../../../components/TicketDetailModal";
import { usePersistentState } from "../../../utils/persistentState";

export interface Ticket {
  id: string;
  priority: string;
  priorityColor: "red" | "orange" | "yellow" | "green";
  org: string;
  summary: string;
  status: "On H" | "With";
  type: "Incident" | "Service Request";
  description?: string;
  requester?: string;
  department?: string;
  createdAt?: string;
  targetSla?: string;
}

const ALL_TICKETS: Ticket[] = [
  { id: "0003951", priority: "High",     priorityColor: "orange", org: "consultancy/EMEA/Liam O'Connor",       summary: "Got an email pretending to be from HR about bonuses...", status: "On H", type: "Incident", description: "Suspicious email received with external phishing links posing as HR compensation review. Account credentials may have been targeted; security quarantine requested." },
  { id: "0003926", priority: "Medium",   priorityColor: "yellow", org: "consultancy/EMEA/James Brown",         summary: "Getting a file size error trying to upload client deck...", status: "With", type: "Incident", description: "Upload to SharePoint portal fails with HTTP 413 Payload Too Large. Presentation file is 85MB; requesting quota expansion or alternative transfer link." },
  { id: "0003841", priority: "Medium",   priorityColor: "yellow", org: "consultancy/EMEA/Kaleem Smith",        summary: "VPN connects for a few seconds then drops...", status: "With", type: "Incident", description: "Cisco AnyConnect establishes connection but disconnects within 15 seconds with gateway timeout error. Multiple EMEA consultants reporting identical behavior." },
  { id: "0003816", priority: "Critical", priorityColor: "red",    org: "consultancy/Americas/Fatima Al-Mansoor", summary: "Trading desk computer won't boot past BIOS...", status: "With", type: "Incident", description: "Workstation workstation-NY-44 powers on but hangs at vendor BIOS screen. No bootable device found error. Urgent priority for market open." },
  { id: "0003801", priority: "High",     priorityColor: "orange", org: "consultancy/EMEA/Aisha Khan",          summary: "Teams meeting invites to external clients failing...", status: "With", type: "Incident", description: "Calendar synchronization failure when generating Teams invite links for external partner domain. Meeting scheduled for 3 PM GMT." },
  { id: "0003701", priority: "Low",      priorityColor: "green",  org: "consultancy/Americas/Kwame Mensah",   summary: "Other people on Zoom calls say my audio echo is severe...", status: "On H", type: "Incident", description: "Poly headset microphone feedback loop during client presentation calls. Driver updates and audio filter configurations required." },
  { id: "0003693", priority: "Low",      priorityColor: "green",  org: "consultancy/EMEA/Liam O'Connor",      summary: "Computer has gotten noticeably slow after Windows update...", status: "With", type: "Incident", description: "System performance degraded after KB5034441 update. High CPU and disk usage observed from Windows Search Indexer service." },
  { id: "0003885", priority: "High",     priorityColor: "orange", org: "consultancy/APAC/Mateo Fernandez",    summary: "Nobody in customer support can access CRM records...", status: "With", type: "Incident", description: "CRM gateway timeout for Sydney support queue. Support team currently unable to log customer inquiries." },
  { id: "0003868", priority: "High",     priorityColor: "orange", org: "consultancy/Americas/Lucas Oliveira", summary: "VPN disconnects constantly while roaming...", status: "On H", type: "Incident", description: "Remote access VPN disconnects when user roams between Wi-Fi and mobile tethering in Americas region." },
  { id: "0003637", priority: "Medium",   priorityColor: "yellow", org: "consultancy/EMEA/Jennifer Williams",  summary: "Goals I set for this quarter never saved in HR portal...", status: "With", type: "Incident", description: "Quarterly review objective entries disappeared upon form submission in SuccessFactors portal." },
  { id: "0003549", priority: "Low",      priorityColor: "green",  org: "consultancy/EMEA/Kaleem Smith",       summary: "Getting a warning banner about expiring security token...", status: "On H", type: "Incident", description: "Kerberos token renewal banner appearing in Outlook. User password not due for renewal for 45 days." },
  { id: "0003450", priority: "High",     priorityColor: "orange", org: "consultancy/EMEA/James Brown",        summary: "Can't connect to virtual machine lab environment...", status: "With", type: "Incident", description: "Remote Desktop connection to Azure VM lab timed out. VM status shows running but network security group rules may be blocking port 3389." },
  { id: "0003373", priority: "Medium",   priorityColor: "yellow", org: "consultancy/EMEA/Jennifer Williams",  summary: "Broke my phone screen, authenticator app inaccessible...", status: "With", type: "Incident", description: "Corporate iPhone screen cracked and touch input unresponsive. Needs temporary MFA bypass code or phone replacement." },
  { id: "0003157", priority: "High",     priorityColor: "orange", org: "consultancy/APAC/John Smith",         summary: "Laptop battery percentage jumps from 90% to 10%...", status: "On H", type: "Incident", description: "Battery hardware failure on ThinkPad T14. Device abruptly powers down during client meetings without charger." },
  { id: "0003947", priority: "Low",      priorityColor: "green",  org: "consultancy/APAC/Diego Morales",      summary: "Requesting approval to install Python and VS Code...", status: "With", type: "Service Request", description: "Data analyst requesting development environment installation for local Python ETL scripts and Jupyter notebooks." },
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
  onSelectTicket: (ticket: Ticket) => void;
}

const TicketRow: React.FC<TicketRowProps> = ({ ticket, selectedItems, onToggle, onSelectTicket }) => (
  <tr
    className={"ticket-row" + (selectedItems.includes(ticket.id) ? " selected" : "")}
    onClick={(e) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      onSelectTicket(ticket);
    }}
    style={{ cursor: "pointer" }}
  >
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
      <button 
        type="button" 
        className="ticket-id-link text-left bg-transparent border-0 cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation();
          onSelectTicket(ticket);
        }}
        title="View complete ticket and request details"
      >
        {ticket.id}
      </button>
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
        {ticket.status === "On H" ? "On Hold" : "With User"}
      </span>
    </td>
  </tr>
);

const OnHoldTicketScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeView, setActiveView] = useState<string>("My Lists");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const [tickets, setTickets] = usePersistentState<Ticket[]>("servigen_onhold_tickets_v1", ALL_TICKETS);

  React.useEffect(() => {
    fetchData();
  }, [activeView]); // Refetch on view change just to simulate loading

  const fetchData = () => {
    setIsLoading(true);
    setCurrentPage(1);
    setSelectedItems([]);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  };

  const handleRefresh = () => {
    fetchData();
  };

  // New Ticket Modal State
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newType, setNewType] = useState<"Incident" | "Service Request">("Incident");
  const [newSummary, setNewSummary] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newPriority, setNewPriority] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [newOrg, setNewOrg] = useState<string>("consultancy/EMEA/Inesh Agarwal");
  const [newStatus, setNewStatus] = useState<"On H" | "With">("On H");

  const handleOpenNewModal = () => {
    setShowNewModal(true);
  };

  const handleCreateNewTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSummary.trim()) return;

    const newId = "000" + (Math.floor(Math.random() * 9000) + 1000);
    const priorityColorMap: Record<string, "red" | "orange" | "yellow" | "green"> = {
      Critical: "red",
      High: "orange",
      Medium: "yellow",
      Low: "green",
    };

    const newTicket: Ticket = {
      id: newId,
      type: newType,
      summary: newSummary.trim(),
      description: newDescription.trim() || newSummary.trim(),
      priority: newPriority,
      priorityColor: priorityColorMap[newPriority] || "yellow",
      org: newOrg.trim() || "consultancy/EMEA/Inesh Agarwal",
      status: newStatus,
      createdAt: "Just now",
      targetSla: "Within 4 hours",
    };

    setTickets((prev) => [newTicket, ...prev]);
    setCurrentPage(1);
    setShowNewModal(false);
    setNewSummary("");
    setNewDescription("");
  };

  // 1. Filter Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.org.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, tickets]);

  // 2. Pagination
  const totalPages = Math.ceil(filteredTickets.length / pageSize);
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTickets.slice(startIndex, startIndex + pageSize);
  }, [filteredTickets, currentPage]);

  const goToNextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(p => Math.max(p - 1, 1));

  const countStart = filteredTickets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const countEnd = Math.min(currentPage * pageSize, filteredTickets.length);

  // 3. Group Tickets
  const groupedTickets = useMemo(() => {
    const groups: Record<string, Ticket[]> = {};
    paginatedTickets.forEach(ticket => {
      let groupKey = "Other";
      if (activeView === "My Lists" || activeView === "Tickets by Type") {
        groupKey = ticket.type;
      } else if (activeView === "Tickets by Status") {
        groupKey = ticket.status === "On H" ? "On Hold" : "With User";
      } else if (activeView === "Tickets by Team") {
        const parts = ticket.org.split("/");
        groupKey = parts.length > 1 ? `${parts[0]}/${parts[1]}` : ticket.org;
      } else if (activeView === "Tickets by Agent") {
        const parts = ticket.org.split("/");
        groupKey = parts.length > 2 ? parts[2] : ticket.org;
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(ticket);
    });
    return groups;
  }, [paginatedTickets, activeView]);

  const allVisibleIds = paginatedTickets.map((t) => t.id);

  const toggleSelect = (id: string): void =>
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>): void =>
    setSelectedItems(e.target.checked ? allVisibleIds : []);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleBulkAssignToMe = () => {
    setTickets((prev) =>
      prev.map((t) =>
        selectedItems.includes(t.id)
          ? { ...t, org: "consultancy/EMEA/Inesh Agarwal" }
          : t
      )
    );
    setSelectedItems([]);
  };

  const handleBulkSetPriority = (priority: string) => {
    const priorityColorMap: Record<string, "red" | "orange" | "yellow" | "green"> = {
      Critical: "red",
      High: "orange",
      Medium: "yellow",
      Low: "green",
    };
    setTickets((prev) =>
      prev.map((t) =>
        selectedItems.includes(t.id)
          ? {
              ...t,
              priority,
              priorityColor: priorityColorMap[priority] || "yellow",
            }
          : t
      )
    );
    setSelectedItems([]);
  };

  const handleBulkSetStatus = (status: "On H" | "With") => {
    setTickets((prev) =>
      prev.map((t) =>
        selectedItems.includes(t.id) ? { ...t, status } : t
      )
    );
    setSelectedItems([]);
  };

  const handleBulkDelete = () => {
    setTickets((prev) => prev.filter((t) => !selectedItems.includes(t.id)));
    setSelectedItems([]);
  };

  return (
    <div className="app-shell">
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
            <span className="tab-plus" onClick={handleOpenNewModal} title="Create new ticket" style={{ cursor: "pointer" }}>+</span>
          </div>
          <div className="topnav-right">
            <button className="btn-get-started" onClick={() => navigate('/dashboard')}>Get started</button>
            <button className="btn-new-ticket" onClick={handleOpenNewModal}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Ticket
            </button>
            <div className="topnav-icons">
              <button className="tnav-icon-btn" onClick={() => alert("Global Search: Coming soon!")}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
              <button className="tnav-icon-btn notif-wrap" onClick={() => alert("Notifications: You have 1 unread alert!")}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span className="notif-dot">1</span>
              </button>
              <button className="tnav-icon-btn" onClick={() => alert("Menu: Coming soon!")}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              </button>
              <button className="tnav-icon-btn" onClick={() => alert("History: Coming soon!")}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </button>
              <button className="tnav-icon-btn" onClick={() => alert("Settings: Coming soon!")}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
            </div>
            <div className="user-avatar-circle" onClick={() => alert("User Profile: Coming soon!")} style={{ cursor: 'pointer' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="content-row">
          <MyList 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            activeView={activeView}
            setActiveView={setActiveView}
          />

          <div className="right-panel">
            <div className="table-toolbar">
              <button className="tb-add-btn" onClick={handleOpenNewModal} title="Create new ticket" style={{ cursor: "pointer" }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <div style={{flex:1}}></div>
              <span className="count-text">{countStart}-{countEnd} of {filteredTickets.length}</span>
              <button className="tb-nav-btn" onClick={goToPrevPage} disabled={currentPage === 1} style={{ opacity: currentPage === 1 ? 0.4 : 1 }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="tb-nav-btn" onClick={goToNextPage} disabled={currentPage === totalPages || totalPages === 0} style={{ opacity: currentPage === totalPages || totalPages === 0 ? 0.4 : 1 }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button className="tb-nav-btn" onClick={handleRefresh}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              </button>
              <button className="btn-new-green" onClick={handleOpenNewModal}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New
              </button>
              <button className="tb-nav-btn">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>
            </div>

            {selectedItems.length > 0 && (
              <div className="onhold-bulk-bar">
                <div className="onhold-bulk-count">
                  <span className="onhold-bulk-badge">{selectedItems.length}</span>
                  <span>{selectedItems.length} ticket{selectedItems.length > 1 ? "s" : ""} selected</span>
                </div>

                <div className="onhold-bulk-actions">
                  <button
                    type="button"
                    className="onhold-bulk-btn"
                    onClick={handleBulkAssignToMe}
                    title="Assign selected tickets to Inesh Agarwal"
                  >
                    Assign to Me
                  </button>

                  <select
                    className="onhold-bulk-select"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkSetPriority(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    aria-label="Set priority for selected tickets"
                  >
                    <option value="" disabled>Set Priority ▾</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  <select
                    className="onhold-bulk-select"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkSetStatus(e.target.value as "On H" | "With");
                        e.target.value = "";
                      }
                    }}
                    aria-label="Change status for selected tickets"
                  >
                    <option value="" disabled>Change Status ▾</option>
                    <option value="On H">On Hold</option>
                    <option value="With">With User</option>
                  </select>

                  <button
                    type="button"
                    className="onhold-bulk-btn onhold-bulk-btn-delete"
                    onClick={handleBulkDelete}
                    title="Delete selected tickets"
                  >
                    Delete
                  </button>

                  <button
                    type="button"
                    className="onhold-bulk-btn"
                    onClick={() => setSelectedItems([])}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

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
              ) : filteredTickets.length === 0 ? (
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
                      <th className="col-check">
                        <input 
                          type="checkbox" 
                          onChange={toggleAll} 
                          checked={selectedItems.length === allVisibleIds.length && allVisibleIds.length > 0}
                        />
                      </th>
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
                    {Object.entries(groupedTickets).map(([groupName, tickets]) => {
                      const isCollapsed = collapsedGroups[groupName];
                      return (
                        <React.Fragment key={groupName}>
                          <tr className="group-header-row" onClick={() => toggleGroup(groupName)}>
                            <td colSpan={9}>
                              <span className="group-toggle">{isCollapsed ? "▶" : "▼"}</span>
                              <span className="group-title"> {groupName} ({tickets.length})</span>
                            </td>
                          </tr>
                          {!isCollapsed && tickets.map((t) => (
                            <TicketRow 
                              key={t.id} 
                              ticket={t} 
                              selectedItems={selectedItems} 
                              onToggle={toggleSelect} 
                              onSelectTicket={setSelectedTicket}
                            />
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <TicketDetailModal
          ticket={{
            id: selectedTicket.id,
            type: selectedTicket.type,
            summary: selectedTicket.summary,
            priority: (selectedTicket.priority as TicketPriority) || "Medium",
            status: selectedTicket.status === "On H" ? "On Hold" : "With User",
            agent: "Inesh Agarwal",
            description: selectedTicket.description,
            requester: selectedTicket.org,
            department: "Consultancy Support",
            createdAt: selectedTicket.createdAt || "12 Oct 2026",
            targetSla: "Target: 4 hours remaining",
          }}
          currentUser="Inesh Agarwal"
          onClose={() => setSelectedTicket(null)}
          onUpdateTicket={(updated) => {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === updated.id
                  ? {
                      ...t,
                      summary: updated.summary,
                      priority: updated.priority,
                      priorityColor:
                        updated.priority === "Critical"
                          ? "red"
                          : updated.priority === "High"
                          ? "orange"
                          : updated.priority === "Medium"
                          ? "yellow"
                          : "green",
                      status: updated.status === "With User" ? "With" : "On H",
                      description: updated.description,
                    }
                  : t
              )
            );
            setSelectedTicket(null);
          }}
        />
      )}

      {showNewModal && (
        <div className="onhold-modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="onhold-modal" onClick={(e) => e.stopPropagation()}>
            <div className="onhold-modal-header">
              <h2>Create New Ticket</h2>
              <button
                type="button"
                className="onhold-modal-close"
                onClick={() => setShowNewModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateNewTicketSubmit} className="onhold-form">
              <div className="onhold-form-row">
                <div className="onhold-form-group">
                  <label>Ticket Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "Incident" | "Service Request")}
                  >
                    <option value="Incident">Incident</option>
                    <option value="Service Request">Service Request</option>
                  </select>
                </div>

                <div className="onhold-form-group">
                  <label>Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as "Critical" | "High" | "Medium" | "Low")}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="onhold-form-group">
                <label>Summary / Subject *</label>
                <input
                  type="text"
                  placeholder="e.g. VPN gateway disconnects intermittently"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="onhold-form-group">
                <label>Description & Technical Details</label>
                <textarea
                  rows={4}
                  placeholder="Provide complete steps, error messages, or workstation details..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div className="onhold-form-row">
                <div className="onhold-form-group">
                  <label>Organisation / User</label>
                  <input
                    type="text"
                    placeholder="e.g. consultancy/EMEA/Inesh Agarwal"
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                  />
                </div>

                <div className="onhold-form-group">
                  <label>Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as "On H" | "With")}
                  >
                    <option value="On H">On Hold</option>
                    <option value="With">With User</option>
                  </select>
                </div>
              </div>

              <div className="onhold-form-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnHoldTicketScreen;
