function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function HaloAvatar() {
  return (
    <span className="greeting-avatar">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="32" fill="#12dff9" />
        <path
          d="M32 14c-9.4 0-17 6.6-17 14.8 0 4.4 2.2 8.4 5.8 11.1-.3 2.6-1.4 5-3.3 7 3.9-.2 7.3-1.6 9.9-3.7 1.4.3 2.8.4 4.6.4 9.4 0 17-6.6 17-14.8S41.4 14 32 14z"
          fill="#ffffff"
        />
        <circle cx="32" cy="28.5" r="8" fill="#12dff9" />
      </svg>

      <span className="greeting-avatar-trophy">🏆</span>
      <span className="greeting-avatar-dot" />
    </span>
  );
}

export default function DashboardGreeting() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="dashboard-greeting">
      <div>
        <h1 className="greeting-title">{getGreeting()} Demo</h1>

        <div className="greeting-profile">
          <HaloAvatar />

          <div className="greeting-profile-text">
            <div className="greeting-profile-line">
              <span className="greeting-name">Demo User</span>
              <span className="greeting-email">demo.user@example.com</span>
            </div>

            <div className="greeting-profile-line">
              <span className="greeting-role">IT Manager</span>

              <span className="greeting-status">
                <span className="greeting-status-dot" />
                Available ▾
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="greeting-date">{today}</div>
    </section>
  );
}