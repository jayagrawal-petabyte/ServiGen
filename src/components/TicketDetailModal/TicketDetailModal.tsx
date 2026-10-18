import React from "react";
import { createPortal } from "react-dom";
import { type FullTicket, type TicketPriority } from "./ticketDetails.data";

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
    site?: string;
    organisationName?: string;
    email?: string;
    phoneNumber?: string;
    preferredNumber?: string;
    isAgent?: boolean;
    timeTaken?: string;
    fromTicketId?: string;
    actionTitle?: string;
    contactAddress?: string[];
    assets?: Array<{ id: string; type: string; icon: "workstation" | "phone" | "monitor" | "laptop" }>;
    projectId?: string;
    projectName?: string;
    workflowName?: string;
    createdBy?: string;
    executionDate?: string;
  } | null;
  currentUser?: string;
  variant?: "incident" | "sla";
  onClose: () => void;
  onUpdateTicket?: (updated: FullTicket) => void;
}

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  Critical:   { bg: "#fef2f2", color: "#dc2626" },
  High:       { bg: "#fff7ed", color: "#ea580c" },
  Medium:     { bg: "#fffbeb", color: "#d97706" },
  Low:        { bg: "#f0fdf4", color: "#16a34a" },
  Unassigned: { bg: "#f8fafc", color: "#64748b" },
};

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, onClose, onUpdateTicket }) => {
  if (!ticket) return null;

  const priority = ticket.priority || "Medium";
  const ps = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE["Medium"];

  const handleResolve = () => {
    if (onUpdateTicket) onUpdateTicket({ ...(ticket as FullTicket), status: "Resolved" });
    onClose();
  };

  const rows: [string, string | undefined][] = [
    ["Category",     ticket.category],
    ["Requester",    ticket.requester],
    ["Agent",        ticket.agent],
    ["Department",   ticket.department],
    ["Organisation", ticket.organisationName],
    ["Site",         ticket.site],
    ["Reported",     ticket.createdAt],
    ["SLA",          ticket.targetSla],
  ];

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(15,23,42,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 12, width: "100%", maxWidth: 520,
          boxShadow: "0 24px 64px rgba(0,0,0,0.16)", overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                display: "inline-block", fontSize: 11, fontWeight: 600, color: "#64748b",
                background: "#f1f5f9", padding: "2px 8px", borderRadius: 4,
                fontFamily: "monospace", marginBottom: 6,
              }}>
                {ticket.id}
              </span>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a", lineHeight: 1.4 }}>
                {ticket.summary || "—"}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                flexShrink: 0, background: "none", border: "none", cursor: "pointer",
                fontSize: 20, color: "#94a3b8", lineHeight: 1, padding: 4, borderRadius: 6,
              }}
            >×</button>
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {ticket.status && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
              }}>
                {ticket.status}
              </span>
            )}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
              background: ps.bg, color: ps.color, border: `1px solid ${ps.color}33`,
            }}>
              {priority}
            </span>
            {ticket.type && (
              <span style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 20,
                background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0",
              }}>
                {ticket.type}
              </span>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
          {rows.filter(([, v]) => !!v).map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ fontSize: 13, color: "#1e293b" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {ticket.description && (
          <div style={{ padding: "0 20px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Description
            </div>
            <div style={{
              fontSize: 13, color: "#334155", lineHeight: 1.6, background: "#f8fafc",
              border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px",
              whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 120, overflowY: "auto",
            }}>
              {ticket.description}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: "12px 20px", borderTop: "1px solid #f1f5f9",
          display: "flex", justifyContent: "flex-end", gap: 8, background: "#fafafa",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
              background: "#fff", color: "#475569", fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}
          >
            Close
          </button>
          <button
            onClick={handleResolve}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}
          >
            ✓ Resolve
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TicketDetailModal;
