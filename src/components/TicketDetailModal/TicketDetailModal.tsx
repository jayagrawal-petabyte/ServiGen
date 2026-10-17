import { useEffect } from "react";
import {
  type FullTicket,
  type TicketPriority,
  enrichTicketDetails,
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

function getStatusClass(status?: string): string {
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

export default function TicketDetailModal({
  ticket,
  currentUser = "Inesh Agarwal",
  onClose,
  onUpdateTicket,
}: TicketDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!ticket) return null;

  const ticketData = enrichTicketDetails(ticket);

  const handleAssignToMe = () => {
    const updated: FullTicket = {
      ...ticketData,
      agent: currentUser,
    };
    onUpdateTicket?.(updated);
  };

  return (
    <div
      className="incident-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="incident-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="incident-modal-close"
          onClick={onClose}
          aria-label="Close ticket details"
        >
          ×
        </button>

        <div className="incident-modal-header">
          <span className="incident-modal-id">
            {ticketData.id}
          </span>

          <h2>{ticketData.summary}</h2>

          <div className="incident-modal-badges">
            <span
              className={`incident-pill priority-${ticketData.priority.toLowerCase()}`}
            >
              {ticketData.priority}
            </span>

            <span
              className={`incident-pill ${getStatusClass(ticketData.status)}`}
            >
              {ticketData.status || "Open"}
            </span>

            <span className="incident-pill status-hold">
              {ticketData.type}
            </span>
          </div>
        </div>

        <div className="incident-details-grid">
          <div className="incident-detail-item">
            <span>Assigned To</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <strong>{ticketData.agent}</strong>
              {ticketData.agent !== currentUser && (
                <button
                  type="button"
                  onClick={handleAssignToMe}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "5px",
                    border: "1px solid #1bc6df",
                    background: "#f0fbfe",
                    color: "#0b8fa3",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title={`Assign to ${currentUser}`}
                >
                  Assign to Me
                </button>
              )}
            </div>
          </div>

          <div className="incident-detail-item">
            <span>Organisation</span>
            <strong>
              {ticketData.department || "ServiGen Global Tech"}
            </strong>
          </div>

          <div className="incident-detail-item">
            <span>Date</span>
            <strong>{ticketData.createdAt || "12 Oct 2026"}</strong>
          </div>

          <div className="incident-detail-item">
            <span>Status</span>
            <strong>{ticketData.status || "Open"}</strong>
          </div>

          <div className="incident-detail-item">
            <span>Requested By</span>
            <strong>{ticketData.requester || "ServiGen User"}</strong>
          </div>

          <div className="incident-detail-item">
            <span>Target SLA</span>
            <strong>{ticketData.targetSla || "Within 4 hours"}</strong>
          </div>
        </div>

        <div className="incident-description">
          <span>Description</span>
          <p>{ticketData.description}</p>
        </div>
      </div>
    </div>
  );
}
