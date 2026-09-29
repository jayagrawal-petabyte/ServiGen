import { TEAM_INCIDENTS } from "./dashboard.data";

export default function OpenIncidentsByTeam() {
  const maxValue = 100;

  return (
    <section className="dashboard-card dashboard-team-card">
      <div className="dashboard-card-header">
        <h2>Open Incidents by Team</h2>

        <button
          type="button"
          className="dashboard-round-action"
          aria-label="Open team incidents"
        >
          →
        </button>
      </div>

      <div className="team-chart">
        <div className="team-axis">
          <span>90</span>
          <span>80</span>
          <span>70</span>
          <span>60</span>
          <span>50</span>
          <span>40</span>
          <span>30</span>
          <span>20</span>
          <span>10</span>
          <span>0</span>
        </div>

        <div className="team-chart-main">
          <div className="team-grid-lines">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="team-bars">
            {TEAM_INCIDENTS.map((team) => (
              <div
                key={team.label}
                className="team-bar-column"
              >
                <span className="team-bar-value">
                  {team.value}
                </span>

                <div className="team-bar-area">
                  <div
                    className="team-bar"
                    style={{
                      height: `${(team.value / maxValue) * 100}%`,
                    }}
                  />
                </div>

                <span className="team-bar-label">
                  {team.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}