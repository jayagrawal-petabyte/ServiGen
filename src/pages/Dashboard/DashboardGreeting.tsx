
import { useState } from "react";
import { useAuth } from "../Auth";
import { usePersistentState } from "../../utils/persistentState";

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function AgentAvatar({ initials }: { initials: string }) {
  return (
    <span
      className="greeting-avatar"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0ea5e9",
        color: "#ffffff",
        fontWeight: 700,
        fontSize: "18px",
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        position: "relative",
        flexShrink: 0,
      }}
      aria-label={`Avatar for ${initials}`}
    >
      {initials}
      <span className="greeting-avatar-trophy">🏆</span>
      <span className="greeting-avatar-dot" />
    </span>
  );
}

const STATUS_OPTIONS = [
  { label: "Available", dotColor: "#10b981" },
  { label: "Busy", dotColor: "#ef4444" },
  { label: "Away", dotColor: "#f59e0b" },
  { label: "In a Meeting", dotColor: "#8b5cf6" },
  { label: "Offline", dotColor: "#64748b" },
];

export default function DashboardGreeting() {
  const { user } = useAuth();

  const [presenceStatus, setPresenceStatus] = usePersistentState<string>(
    "servigen_agent_presence_status",
    "Available"
  );
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const currentOption =
    STATUS_OPTIONS.find((option) => option.label === presenceStatus) ??
    STATUS_OPTIONS[0];

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const displayName = user?.fullName?.trim() || '';
  const firstName =
    user?.firstName?.trim() || displayName.split(/\s+/)[0] || '';
  const email = user?.email || '';
  const role = user?.role || "Administrator";

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "IA";

  const handleStatusChange = (status: string) => {
    setPresenceStatus(status);
    setIsStatusOpen(false);
  };

  return (
    <section className="dashboard-greeting">
      <div>
        <h1 className="greeting-title">
          {getGreeting()} {firstName}
        </h1>

        <div className="greeting-profile">
          <AgentAvatar initials={initials} />

          <div className="greeting-profile-text">
            <div className="greeting-profile-line">
              <span className="greeting-name">{displayName}</span>
              <span className="greeting-email">{email}</span>
            </div>

            <div className="greeting-profile-line">
              <span className="greeting-role">{role}</span>

              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                }}
              >
                <button
                  type="button"
                  className="greeting-status"
                  aria-haspopup="true"
                  aria-expanded={isStatusOpen}
                  onClick={() =>
                    setIsStatusOpen((previous) => !previous)
                  }
                  style={{
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                  title="Change your presence status"
                >
                  <span
                    className="greeting-status-dot"
                    style={{
                      backgroundColor: currentOption.dotColor,
                    }}
                  />
                  {currentOption.label} ▾
                </button>

                {isStatusOpen && (
                  <div
                    role="menu"
                    aria-label="Presence status options"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: "4px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      zIndex: 60,
                      minWidth: "140px",
                      padding: "4px 0",
                    }}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        role="menuitemradio"
                        aria-checked={option.label === currentOption.label}
                        onClick={() => handleStatusChange(option.label)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "7px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12px",
                          fontWeight:
                            option.label === currentOption.label ? 700 : 500,
                          color: "#334155",
                          background:
                            option.label === currentOption.label
                              ? "#f1f5f9"
                              : "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: option.dotColor,
                            flexShrink: 0,
                          }}
                        />
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="greeting-date">{today}</div>
    </section>
  );
}
