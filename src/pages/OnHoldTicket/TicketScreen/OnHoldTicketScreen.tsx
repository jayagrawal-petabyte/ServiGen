import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./OnHoldTicketScreen.css";
import MyList from "../mylist/MyList";
import { useAuth } from "../../Auth";
import { TicketDetailModal, type TicketPriority } from "../../../components/TicketDetailModal";
import { usePersistentState } from "../../../utils/persistentState";
import { GlobalNavbarActions } from "../../../components/shared/GlobalNavbarActions";
import {
  fetchOnHoldTickets,
  fetchActiveTickets,
  fetchClosedTickets,
  updateOnHoldTicketStatus,
  bulkUpdateTicketStatus,
  createNewTicket,
  bulkUpdateTicketPriority,
  bulkAssignTickets,
  bulkDeleteTickets,
} from "../services/onHoldTicketsApi";

export interface Ticket {
  id: string;
  priority: string;
  priorityColor: "red" | "orange" | "yellow" | "green";
  org: string;
  summary: string;
  status: "On H" | "With" | "New" | "Actioned";
  type: "Incident" | "Service Request";
  description?: string;
  requester?: string;
  department?: string;
  createdAt?: string;
  targetSla?: string;
}

export const NEW_TICKETS_DATA: Ticket[] = [
  { id: "0003012", priority: "High", priorityColor: "orange", org: "consultancy/EMEA/Admin", summary: "Request external monitor", status: "New", type: "Service Request", targetSla: "-40:01", description: "Standard external monitor requisition for developer workstation." },
  { id: "0003011", priority: "Low", priorityColor: "green", org: "consultancy/EMEA/General User", summary: "Install Adobe Acrobat Pro", status: "New", type: "Service Request", targetSla: "-88:01", description: "Software deployment request for Adobe Creative Suite licensing." },
  { id: "0003010", priority: "Medium", priorityColor: "yellow", org: "consultancy/EMEA/Mary Johnson", summary: "Access request for shared folder", status: "New", type: "Service Request", targetSla: "-64:00", description: "Permission escalation for departmental network share drive." },
  { id: "0003009", priority: "High", priorityColor: "orange", org: "consultancy/EMEA/James Brown", summary: "Request new laptop for new sta...", status: "New", type: "Service Request", targetSla: "-40:01", description: "Hardware provisioning for incoming technical consultant." },
  { id: "0002237", priority: "Low", priorityColor: "green", org: "consultancy/EMEA/General User", summary: "Request Addition of New Printer ...", status: "New", type: "Service Request", targetSla: "-40:01", description: "Network printer IP assignment and CUPS queue mapping." },
  { id: "0002236", priority: "Low", priorityColor: "green", org: "consultancy/EMEA/General User", summary: "Request Printer Maintenance Se...", status: "New", type: "Service Request", targetSla: "-40:01", description: "Quarterly preventative maintenance service for 3rd floor MFP." },
  { id: "0002235", priority: "Low", priorityColor: "green", org: "consultancy/EMEA/General User", summary: "Printer Access for New Employee", status: "New", type: "Service Request", targetSla: "-88:01", description: "Active Directory security group membership for secure badge printing." },
  { id: "0002234", priority: "Low", priorityColor: "green", org: "consultancy/EMEA/General User", summary: "Printer Configuration Change", status: "New", type: "Service Request", targetSla: "-64:00", description: "Duplex and color profile preset configuration update." },
  { id: "0002233", priority: "Low", priorityColor: "green", org: "consultancy/EMEA/General User", summary: "Printer Toner Replacement", status: "New", type: "Service Request", targetSla: "-40:01", description: "Consumable cartridge replacement request for finance queue." },
  { id: "0002232", priority: "Low", priorityColor: "green", org: "consultancy/EMEA/General User", summary: "Office 365 License Activation", status: "New", type: "Service Request", targetSla: "-40:01", description: "M365 E5 license assignment for newly onboarded team member." },
  { id: "0002231", priority: "Medium", priorityColor: "yellow", org: "consultancy/EMEA/General User", summary: "VPN Certificate Renewal", status: "New", type: "Service Request", targetSla: "-40:01", description: "User client TLS certificate expired on macOS workstation." },
  { id: "0002230", priority: "High", priorityColor: "orange", org: "consultancy/EMEA/General User", summary: "Production Database Access", status: "New", type: "Service Request", targetSla: "-40:01", description: "Read-only replica access approval for monthly financial audit." },
];

export const MAJOR_INCIDENT_ROW: Ticket = {
  id: "0002673-P",
  priority: "Critical",
  priorityColor: "red",
  org: "consultancy/EMEA/General User",
  summary: "System Login Failure",
  status: "New",
  type: "Incident",
  targetSla: "-179:06",
  description: "Global authentication provider timeout. Users experiencing SSO login failure on primary portal.",
};

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
    <td className="col-check" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={selectedItems.includes(ticket.id)} onChange={() => onToggle(ticket.id)} />
    </td>
    <td className="col-viewing">
      {ticket.status === "On H" ? (
        <span className="badge-onhold">On Hold</span>
      ) : ticket.status === "Actioned" ? (
        <span className="badge-onhold" style={{ background: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1" }}>Closed</span>
      ) : ticket.status === "With" ? (
        <span className="badge-onhold" style={{ background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" }}>Pending</span>
      ) : (
        <span className="badge-onhold" style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}>Active</span>
      )}
    </td>
    <td className="col-id">
      <button 
        type="button" 
        className="ticket-id-link text-left bg-transparent border-0 cursor-pointer font-bold text-gray-900" 
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
      {ticket.targetSla ? (
        <span className="sla-bar-red">{ticket.targetSla}</span>
      ) : (
        <span className="sla-text">On Hold</span>
      )}
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
      {ticket.status === "Actioned" ? (
        <span className="status-badge" style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" }}>Closed</span>
      ) : ticket.status === "On H" ? (
        <span className="status-badge status-cyan">On Hold</span>
      ) : ticket.status === "With" ? (
        <span className="status-badge status-teal">With User</span>
      ) : (
        <span className="status-badge status-new">Active</span>
      )}
    </td>
  </tr>
);

const OnHoldTicketScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeView, setActiveView] = useState<string>("My New Tickets");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showKpiDrawer, setShowKpiDrawer] = useState<boolean>(false);
  const [showFeedPopover, setShowFeedPopover] = useState<boolean>(false);
  const [showTimesheetPopover, setShowTimesheetPopover] = useState<boolean>(false);
  const [majorIncidentCollapsed, setMajorIncidentCollapsed] = useState<boolean>(false);

  // Authenticated user state
  const { user } = useAuth();
  const currentUserName = user?.fullName || "Support Agent";
  const defaultOrg = user
    ? `consultancy/${user.region || 'EMEA'}/${user.fullName || 'Support Agent'}`
    : 'consultancy/EMEA/Support Agent';

  // Flyouts & Modals State
  const [activeFlyout, setActiveFlyout] = useState<
    "search" | "notifications" | "menu" | "history" | "settings" | "profile" | "more" | null
  >(null);
  const [unreadNotif, setUnreadNotif] = useState<number>(1);
  const [showGetStartedModal, setShowGetStartedModal] = useState<boolean>(false);
  const flyoutRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setActiveFlyout(null);
      }
    }
    if (activeFlyout) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeFlyout]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const [tickets, setTickets] = useState<Ticket[]>([]);

  React.useEffect(() => {
    fetchData();
  }, [activeView]);

  const fetchData = async () => {
    setIsLoading(true);
    setCurrentPage(1);
    setSelectedItems([]);
    try {
      let liveTickets: Ticket[] = [];
      if (activeView === "My New Tickets") {
        liveTickets = await fetchActiveTickets([]);
      } else if (activeView === "My Closed Tickets") {
        liveTickets = await fetchClosedTickets([]);
      } else if (activeView === "My Followed Tickets") {
        liveTickets = [];
      } else {
        liveTickets = await fetchOnHoldTickets([]);
      }
      setTickets(liveTickets);
    } catch (err) {
      console.warn("Failed to fetch tickets from backend:", err);
    } finally {
      setIsLoading(false);
    }
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
  const [newOrg, setNewOrg] = useState<string>(defaultOrg);
  const [newStatus, setNewStatus] = useState<"New" | "On H" | "With">("New");

  const handleOpenNewModal = () => {
    setNewStatus(activeView === "My On Hold Tickets" ? "On H" : "New");
    setShowNewModal(true);
  };

  const handleCreateNewTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSummary.trim()) return;

    const newId = "TICK-" + (Math.floor(Math.random() * 9000) + 1000);
    const priorityColorMap: Record<string, "red" | "orange" | "yellow" | "green"> = {
      Critical: "red",
      High: "orange",
      Medium: "yellow",
      Low: "green",
    };

    const draftTicket: Ticket = {
      id: newId,
      type: newType,
      summary: newSummary.trim(),
      description: newDescription.trim() || newSummary.trim(),
      priority: newPriority,
      priorityColor: priorityColorMap[newPriority] || "yellow",
      org: newOrg.trim() || defaultOrg,
      status: newStatus,
      createdAt: "Just now",
      targetSla:
        newStatus === "On H"
          ? "On Hold"
          : newPriority === "Critical"
          ? "Within 1 hour"
          : newPriority === "High"
          ? "Within 2 hours"
          : "Within 4 hours",
    };

    try {
      const persisted = await createNewTicket(draftTicket);
      setTickets((prev) => [persisted, ...prev]);
    } catch {
      setTickets((prev) => [draftTicket, ...prev]);
    }

    if (newStatus === "New" && activeView === "My On Hold Tickets") {
      setActiveView("My New Tickets");
    } else if (newStatus === "On H" && activeView === "My New Tickets") {
      setActiveView("My On Hold Tickets");
    }

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

  const goToNextPage = () => {
    setCurrentPage(p => Math.min(p + 1, totalPages));
    setSelectedItems([]);
  };
  const goToPrevPage = () => {
    setCurrentPage(p => Math.max(p - 1, 1));
    setSelectedItems([]);
  };

  const countStart = filteredTickets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const countEnd = Math.min(currentPage * pageSize, filteredTickets.length);

  // 3. Group Tickets
  const groupedTickets = useMemo(() => {
    const groups: Record<string, Ticket[]> = {};
    paginatedTickets.forEach(ticket => {
      let groupKey: string = ticket.type || "Incident";
      if (activeView === "Tickets by Status") {
        groupKey = ticket.status === "On H" ? "On Hold" : ticket.status === "Actioned" ? "Closed" : ticket.status === "With" ? "With User" : "Active";
      } else if (activeView === "Tickets by Team") {
        const parts = ticket.org.split("/");
        groupKey = parts.length > 1 ? `${parts[0]}/${parts[1]}` : ticket.org;
      } else if (activeView === "Tickets by Agent") {
        const parts = ticket.org.split("/");
        groupKey = parts.length > 2 ? parts[2] : ticket.org;
      } else {
        groupKey = ticket.type || "Incident";
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

  const handleBulkAssignToMe = async () => {
    const affectedIds = [...selectedItems];
    setTickets((prev) =>
      prev.map((t) =>
        affectedIds.includes(t.id)
          ? { ...t, org: defaultOrg }
          : t
      )
    );
    setSelectedItems([]);
    await bulkAssignTickets(affectedIds, "agent-001");
  };

  const handleBulkSetPriority = async (priority: string) => {
    const priorityColorMap: Record<string, "red" | "orange" | "yellow" | "green"> = {
      Critical: "red",
      High: "orange",
      Medium: "yellow",
      Low: "green",
    };
    const affectedIds = [...selectedItems];
    setTickets((prev) =>
      prev.map((t) =>
        affectedIds.includes(t.id)
          ? {
              ...t,
              priority,
              priorityColor: priorityColorMap[priority] || "yellow",
            }
          : t
      )
    );
    setSelectedItems([]);
    await bulkUpdateTicketPriority(affectedIds, priority);
  };

  const handleBulkSetStatus = async (status: "On H" | "With") => {
    const backendStatus = status === "On H" ? "On Hold" : "Pending";
    const affectedIds = [...selectedItems];

    setTickets((prev) =>
      prev.map((t) =>
        affectedIds.includes(t.id) ? { ...t, status } : t
      )
    );
    setSelectedItems([]);

    await bulkUpdateTicketStatus(affectedIds, backendStatus);
  };

  const handleBulkDelete = async () => {
    const affectedIds = [...selectedItems];
    setTickets((prev) => prev.filter((t) => !affectedIds.includes(t.id)));
    setSelectedItems([]);
    await bulkDeleteTickets(affectedIds);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Type", "Priority", "Status", "Organisation", "Summary"];
    const rows = filteredTickets.map((t) => [
      t.id,
      t.type,
      t.priority,
      t.status === "On H" ? "On Hold" : "With User",
      `"${t.org}"`,
      `"${t.summary.replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `on_hold_tickets_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActiveFlyout(null);
  };

  const handleToggleAllGroups = () => {
    const allGroupKeys = Object.keys(groupedTickets);
    const areAnyOpen = allGroupKeys.some((k) => !collapsedGroups[k]);
    const nextCollapsed: Record<string, boolean> = {};
    allGroupKeys.forEach((k) => {
      nextCollapsed[k] = areAnyOpen;
    });
    setCollapsedGroups(nextCollapsed);
    setActiveFlyout(null);
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
                {activeView === "My New Tickets" ? (
                  <>
                    <span style={{ marginRight: 5 }}>📰</span>
                    My New Tickets
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="#ef4444" style={{marginRight:5,flexShrink:0}}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    {activeView}
                  </>
                )}
              </span>
            </span>
          </div>
          <div className="topnav-tab-bar">
            <span className="tab-plus" onClick={handleOpenNewModal} title="Create new ticket" style={{ cursor: "pointer" }}>+</span>
          </div>
          <div className="topnav-right">
            <GlobalNavbarActions
              onGetStarted={() => setShowGetStartedModal(true)}
              onNewTicket={handleOpenNewModal} onOpenTicket={(id) => {
              const match = NEW_TICKETS_DATA.find((t) => t.id === id) || tickets.find((t) => t.id === id);
              if (match) setSelectedTicket(match);
            }} /></div>
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

              {/* Toolbar More Menu */}
              <div className="onhold-flyout-wrap" ref={activeFlyout === "more" ? flyoutRef : undefined}>
                <button
                  type="button"
                  className="tb-nav-btn"
                  onClick={() => setActiveFlyout(p => p === "more" ? null : "more")}
                  title="More Actions"
                  style={{ cursor: "pointer" }}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </button>
                {activeFlyout === "more" && (
                  <div className="onhold-flyout-menu" style={{ width: 220, right: 0 }}>
                    <div className="onhold-flyout-header">
                      <span>Table Actions</span>
                    </div>
                    <div className="onhold-flyout-list">
                      <button type="button" className="onhold-flyout-item" onClick={handleExportCSV}>
                        <span className="onhold-flyout-item-title">📥 Export as CSV</span>
                      </button>
                      <button type="button" className="onhold-flyout-item" onClick={handleToggleAllGroups}>
                        <span className="onhold-flyout-item-title">↕ Toggle All Groups</span>
                      </button>
                      <button
                        type="button"
                        className="onhold-flyout-item"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedItems([]);
                          setActiveFlyout(null);
                        }}
                      >
                        <span className="onhold-flyout-item-title">🔄 Reset Filters</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                    title={`Assign selected tickets to ${currentUserName}`}
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
                  <p>We couldn't find any {activeView.toLowerCase()} matching your criteria.</p>
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
                    {activeView === "My New Tickets" ? (
                      <>
                        {paginatedTickets.map((t) => (
                          <TicketRow 
                            key={t.id} 
                            ticket={t} 
                            selectedItems={selectedItems} 
                            onToggle={toggleSelect} 
                            onSelectTicket={setSelectedTicket}
                          />
                        ))}
                        {currentPage === 1 && (
                          <>
                            <tr
                              className="major-incident-group-row"
                              onClick={() => setMajorIncidentCollapsed(!majorIncidentCollapsed)}
                            >
                              <td colSpan={9}>
                                <span className="group-toggle" style={{ marginRight: 6 }}>
                                  {majorIncidentCollapsed ? "▶" : "▼"}
                                </span>
                                Major Incident (1)
                              </td>
                            </tr>
                            {!majorIncidentCollapsed && (
                              <tr
                                className="ticket-row major-incident-ticket-row"
                                onClick={() => navigate('/major-incidents/live?incident=0002673')}
                                style={{ cursor: "pointer" }}
                              >
                                <td className="col-type">
                                  <span className="mi-arrow-icon">▶</span>
                                </td>
                                <td className="col-check" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.includes(MAJOR_INCIDENT_ROW.id)}
                                    onChange={() => toggleSelect(MAJOR_INCIDENT_ROW.id)}
                                  />
                                </td>
                                <td className="col-viewing"></td>
                                <td className="col-id">
                                  <button
                                    type="button"
                                    className="ticket-id-link text-left bg-transparent border-0 cursor-pointer font-bold text-gray-900"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/major-incidents/live?incident=0002673');
                                    }}
                                  >
                                    {MAJOR_INCIDENT_ROW.id}
                                  </button>
                                </td>
                                <td className="col-sla">
                                  <span className="sla-bar-red">{MAJOR_INCIDENT_ROW.targetSla}</span>
                                </td>
                                <td className="col-priority">
                                  <span className="priority-dot" style={{ backgroundColor: "#ef4444" }}></span>
                                  <span className="priority-label">{MAJOR_INCIDENT_ROW.priority}</span>
                                </td>
                                <td className="col-org">
                                  <span className="org-link">{MAJOR_INCIDENT_ROW.org}</span>
                                </td>
                                <td className="col-summary">{MAJOR_INCIDENT_ROW.summary}</td>
                                <td className="col-status">
                                  <span className="status-badge status-new">New</span>
                                </td>
                              </tr>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      Object.entries(groupedTickets).map(([groupName, tickets]) => {
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
                      })
                    )}
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
            status:
              selectedTicket.status === "On H"
                ? "On Hold"
                : selectedTicket.status === "Actioned"
                ? "Closed"
                : selectedTicket.status === "With"
                ? "With User"
                : "Active",
            agent: selectedTicket.org.split("/")[2] || currentUserName,
            description: selectedTicket.description,
            requester: selectedTicket.org,
            department: "Consultancy Support",
            createdAt: selectedTicket.createdAt || "12 Oct 2026",
            targetSla: selectedTicket.targetSla || "Target: 4 hours remaining",
          }}
          currentUser={currentUserName}
          onClose={() => setSelectedTicket(null)}
          onUpdateTicket={async (updated) => {
            const norm = (updated.status || "").toLowerCase();
            let backendStatus: 'On Hold' | 'Active' | 'Pending' | 'Actioned' = 'On Hold';
            let uiStatus: 'On H' | 'With' | 'New' | 'Actioned' = 'On H';

            if (norm.includes('closed') || norm.includes('actioned') || norm.includes('resolved')) {
              backendStatus = 'Actioned';
              uiStatus = 'Actioned';
            } else if (norm.includes('with') || norm.includes('pending')) {
              backendStatus = 'Pending';
              uiStatus = 'With';
            } else if (norm.includes('active') || norm.includes('progress') || norm.includes('new')) {
              backendStatus = 'Active';
              uiStatus = 'New';
            } else {
              backendStatus = 'On Hold';
              uiStatus = 'On H';
            }

            await updateOnHoldTicketStatus(updated.id, backendStatus, updated.description);
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
                      status: uiStatus,
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
                    placeholder={`e.g. ${defaultOrg}`}
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                  />
                </div>

                <div className="onhold-form-group">
                  <label>Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as "New" | "On H" | "With")}
                  >
                    <option value="New">Active (My New Tickets)</option>
                    <option value="On H">On Hold</option>
                    <option value="With">With User (Pending)</option>
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

      {showGetStartedModal && (
        <div className="onhold-modal-overlay" onClick={() => setShowGetStartedModal(false)}>
          <div className="onhold-modal" onClick={(e) => e.stopPropagation()}>
            <div className="onhold-modal-header">
              <h2>My On Hold Tickets Guide</h2>
              <button
                type="button"
                className="onhold-modal-close"
                onClick={() => setShowGetStartedModal(false)}
                aria-label="Close guide"
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
              <div style={{ padding: "12px 14px", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
                <strong style={{ color: "#0369a1", display: "block", marginBottom: 4 }}>📌 What is the On Hold Queue?</strong>
                Tickets placed in "On Hold" state temporarily pause active SLA countdowns while awaiting customer feedback, vendor hardware shipment, or change freeze windows.
              </div>

              <div>
                <strong style={{ color: "#0f172a", display: "block", marginBottom: 4 }}>⚡ Key Features Available:</strong>
                <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  <li><strong>Full Detail View:</strong> Click anywhere on a ticket row or ID to inspect the full request description and specifications.</li>
                  <li><strong>Bulk Operations:</strong> Select multiple checkboxes to batch reassign agents, change priorities, or update status in one click.</li>
                  <li><strong>Interactive Ticket Creation:</strong> Use the <code>+ New Ticket</code> or green <code>+ New</code> buttons to record new tickets with custom input.</li>
                  <li><strong>Export Data:</strong> Access the <code>···</code> toolbar menu to instantly export the current table to CSV format.</li>
                </ul>
              </div>
            </div>

            <div className="onhold-form-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => {
                  setShowGetStartedModal(false);
                  navigate('/incidents');
                }}
              >
                View Incidents Queue →
              </button>
              <button
                type="button"
                className="btn-modal-submit"
                onClick={() => setShowGetStartedModal(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnHoldTicketScreen;
