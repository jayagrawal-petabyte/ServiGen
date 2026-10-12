import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  type FullTicket,
  type TicketPriority,
  enrichTicketDetails,
  AVAILABLE_AGENTS,
  AVAILABLE_PRIORITIES,
  AVAILABLE_STATUSES,
} from "./ticketDetails.data";
import "./TicketDetailModal.css";

interface TicketDetailModalProps {
  ticket: {
    id: string;
    type?: string;
    summary?: string;
    agent?: string;
    priority?: TicketPriority;
    status?: string;
    description?: string;
    requester?: string;
    department?: string;
    category?: string;
    createdAt?: string;
    targetSla?: string;
    notes?: Array<{ id: string; author: string; time: string; text: string }>;
  } | null;
  currentUser?: string;
  onClose: () => void;
  onUpdateTicket?: (updated: FullTicket) => void;
}

const PRIORITY_COLORS: Record<TicketPriority, { bg: string; color: string; border: string }> = {
  Critical: { bg: "#fff0f0", color: "#bb4444", border: "#efc5c5" },
  High: { bg: "#fff5ea", color: "#ba6e2c", border: "#f0d1ae" },
  Medium: { bg: "#fff9e4", color: "#957317", border: "#efdfac" },
  Low: { bg: "#edf9ef", color: "#39834f", border: "#cce6d0" },
  Unassigned: { bg: "#f3f5f7", color: "#6b7581", border: "#d9dfe6" },
};

export default function TicketDetailModal({
  ticket,
  currentUser = "Inesh Agarwal",
  onClose,
  onUpdateTicket,
}: TicketDetailModalProps) {
  const navigate = useNavigate();

  const [ticketData, setTicketData] = useState<FullTicket | null>(() =>
    ticket ? enrichTicketDetails(ticket) : null
  );
  const [newNoteText, setNewNoteText] = useState("");

  useEffect(() => {
    if (ticket) {
      setTicketData(enrichTicketDetails(ticket));
    }
  }, [ticket]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!ticket || !ticketData) return null;

  const handleAssignToMe = () => {
    const updated: FullTicket = {
      ...ticketData,
      agent: currentUser,
      notes: [
        ...(ticketData.notes || []),
        {
          id: `n-${Date.now()}`,
          author: currentUser,
          time: "Just now",
          text: `Assigned ticket to ${currentUser}.`,
        },
      ],
    };
    setTicketData(updated);
    onUpdateTicket?.(updated);
  };

  const handleAgentChange = (newAgent: string) => {
    const updated: FullTicket = {
      ...ticketData,
      agent: newAgent,
      notes: [
        ...(ticketData.notes || []),
        {
          id: `n-${Date.now()}`,
          author: currentUser,
          time: "Just now",
          text: `Reassigned ticket to ${newAgent}.`,
        },
      ],
    };
    setTicketData(updated);
    onUpdateTicket?.(updated);
  };

  const handlePriorityChange = (newPriority: TicketPriority) => {
    const updated: FullTicket = {
      ...ticketData,
      priority: newPriority,
      notes: [
        ...(ticketData.notes || []),
        {
          id: `n-${Date.now()}`,
          author: currentUser,
          time: "Just now",
          text: `Priority updated to ${newPriority}.`,
        },
      ],
    };
    setTicketData(updated);
    onUpdateTicket?.(updated);
  };

  const handleStatusChange = (newStatus: string) => {
    const updated: FullTicket = {
      ...ticketData,
      status: newStatus,
      notes: [
        ...(ticketData.notes || []),
        {
          id: `n-${Date.now()}`,
          author: currentUser,
          time: "Just now",
          text: `Status changed to ${newStatus}.`,
        },
      ],
    };
    setTicketData(updated);
    onUpdateTicket?.(updated);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote = {
      id: `n-${Date.now()}`,
      author: currentUser,
      time: "Just now",
      text: newNoteText.trim(),
    };

    const updated: FullTicket = {
      ...ticketData,
      notes: [...(ticketData.notes || []), newNote],
    };
    setTicketData(updated);
    onUpdateTicket?.(updated);
    setNewNoteText("");
  };

  const handleOpenInModule = () => {
    onClose();
    if (ticketData.type === "Major Incident") {
      navigate("/major-incidents/live");
    } else if (ticketData.type === "Project Task") {
      navigate("/projects");
    } else if (ticketData.type === "Service Request") {
      navigate("/services-catalogue");
    } else {
      navigate("/team/1st-line-live");
    }
  };

  const typeClass =
    ticketData.type === "Project Task"
      ? "ticket-type-project"
      : ticketData.type === "Service Request"
      ? "ticket-type-service"
      : ticketData.type === "Major Incident"
      ? "ticket-type-major"
      : "ticket-type-incident";

  const statusClass =
    ticketData.status === "In Progress"
      ? "ticket-detail-status-progress"
      : ticketData.status === "Resolved"
      ? "ticket-detail-status-resolved"
      : ticketData.status === "On Hold"
      ? "ticket-detail-status-hold"
      : "ticket-detail-status-open";

  const priorityStyle = PRIORITY_COLORS[ticketData.priority] || PRIORITY_COLORS.Medium;

  return (
    <div
      className="ticket-detail-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
    >
      <div
        className="ticket-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="ticket-detail-modal-header">
          <div className="ticket-detail-header-left">
            <div className="ticket-detail-badges-row">
              <span className="ticket-detail-id-badge">#{ticketData.id}</span>
              <span className={`ticket-detail-type-badge ${typeClass}`}>
                {ticketData.type}
              </span>
              <span
                className="ticket-detail-priority-badge"
                style={{
                  background: priorityStyle.bg,
                  color: priorityStyle.color,
                  border: `1px solid ${priorityStyle.border}`,
                }}
              >
                ● {ticketData.priority} Priority
              </span>
              <span className={`ticket-detail-status-badge ${statusClass}`}>
                {ticketData.status || "Open"}
              </span>
            </div>
            <h2 id="ticket-modal-title" className="ticket-detail-modal-title">
              {ticketData.summary}
            </h2>
          </div>

          <button
            type="button"
            className="ticket-detail-modal-close"
            onClick={onClose}
            aria-label="Close ticket details"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="ticket-detail-modal-body">
          {/* Key Properties Grid */}
          <div className="ticket-detail-properties-grid">
            {/* Assigned Agent */}
            <div className="ticket-property-card">
              <span className="ticket-property-label">Assigned Agent</span>
              <div className="ticket-property-value">
                <span className="ticket-agent-badge">
                  👤 <span>{ticketData.agent}</span>
                </span>
                {ticketData.agent !== currentUser && (
                  <button
                    type="button"
                    className="ticket-inline-btn"
                    onClick={handleAssignToMe}
                    title={`Assign to ${currentUser}`}
                  >
                    Assign to Me
                  </button>
                )}
              </div>
            </div>

            {/* Requester & Department */}
            <div className="ticket-property-card">
              <span className="ticket-property-label">Requested By</span>
              <div className="ticket-property-value">
                <span>{ticketData.requester}</span>
              </div>
            </div>

            {/* Department */}
            <div className="ticket-property-card">
              <span className="ticket-property-label">Department</span>
              <div className="ticket-property-value">
                <span>{ticketData.department}</span>
              </div>
            </div>

            {/* Target SLA */}
            <div className="ticket-property-card">
              <span className="ticket-property-label">SLA Countdown</span>
              <div className="ticket-property-value">
                <span>⏱ {ticketData.targetSla}</span>
              </div>
            </div>

            {/* Category */}
            <div className="ticket-property-card">
              <span className="ticket-property-label">Category</span>
              <div className="ticket-property-value">
                <span style={{ fontSize: "12px", color: "#475569" }}>
                  {ticketData.category}
                </span>
              </div>
            </div>

            {/* Created Timestamp */}
            <div className="ticket-property-card">
              <span className="ticket-property-label">Created Date</span>
              <div className="ticket-property-value">
                <span>📅 {ticketData.createdAt}</span>
              </div>
            </div>

            {/* Status Selector */}
            <div className="ticket-property-card">
              <span className="ticket-property-label">Status</span>
              <select
                className="ticket-property-select"
                value={ticketData.status || "Open"}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Change ticket status"
              >
                {AVAILABLE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Selector */}
            <div className="ticket-property-card">
              <span className="ticket-property-label">Priority</span>
              <select
                className="ticket-property-select"
                value={ticketData.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                aria-label="Change ticket priority"
              >
                {AVAILABLE_PRIORITIES.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>

            {/* Reassign Agent Dropdown */}
            <div className="ticket-property-card">
              <span className="ticket-property-label">Reassign Agent</span>
              <select
                className="ticket-property-select"
                value={ticketData.agent}
                onChange={(e) => handleAgentChange(e.target.value)}
                aria-label="Reassign agent"
              >
                {AVAILABLE_AGENTS.map((ag) => (
                  <option key={ag} value={ag}>
                    {ag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Full Request Body / Description */}
          <div className="ticket-detail-description-section">
            <h3 className="ticket-section-title">
              <span>📄</span> Request Description & Specifications
            </h3>
            <div className="ticket-detail-description-box">
              <p className="ticket-detail-description-text">
                {ticketData.description}
              </p>
            </div>
          </div>

          {/* Internal Notes & Activity Stream */}
          <div className="ticket-detail-notes-section">
            <h3 className="ticket-section-title">
              <span>💬</span> Activity Log & Internal Notes
            </h3>

            <div className="ticket-notes-timeline">
              {ticketData.notes && ticketData.notes.length > 0 ? (
                ticketData.notes.map((note) => (
                  <div key={note.id} className="ticket-note-item">
                    <div className="ticket-note-meta">
                      <span className="ticket-note-author">{note.author}</span>
                      <span className="ticket-note-time">{note.time}</span>
                    </div>
                    <p className="ticket-note-text">{note.text}</p>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  No internal notes recorded.
                </div>
              )}
            </div>

            {/* Add note composer */}
            <form onSubmit={handleAddNote} className="ticket-add-note-form">
              <input
                type="text"
                placeholder="Add an internal note or update..."
                className="ticket-add-note-input"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
              />
              <button
                type="submit"
                className="ticket-add-note-btn"
                disabled={!newNoteText.trim()}
              >
                Post Note
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="ticket-detail-modal-footer">
          <div className="ticket-footer-left">
            {ticketData.agent !== currentUser && (
              <button
                type="button"
                className="ticket-btn-primary"
                onClick={handleAssignToMe}
              >
                Assign to Me
              </button>
            )}

            <button
              type="button"
              className="ticket-btn-link"
              onClick={handleOpenInModule}
              title={`Optionally open in full ${ticketData.type} queue view`}
            >
              Open in Module Queue ↗
            </button>
          </div>

          <div className="ticket-footer-right">
            <button
              type="button"
              className="ticket-btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
