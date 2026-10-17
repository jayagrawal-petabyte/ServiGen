import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TEAM_INCIDENTS, type TeamIncident } from "./dashboard.data";
import dashboardService from "../../services/dashboardService";

export default function OpenIncidentsByTeam() {
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState<TeamIncident[]>(TEAM_INCIDENTS);
  const maxValue = 90;

  useEffect(() => {
    let mounted = true;
    dashboardService.getIncidentsByTeam().then((data) => {
      if (mounted && data?.length) {
        setTeamData(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleTeamClick = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('2nd')) {
      navigate('/team/2nd-line-live');
    } else if (lower.includes('major')) {
      navigate('/major-incidents/live');
    } else {
      navigate('/team/1st-line-live');
    }
  };

  return (
    <section className="dashboard-card dashboard-team-card">
      <div className="dashboard-card-header">
        <h2>Open Incidents by Team</h2>

        <button
          type="button"
          className="dashboard-round-action"
          aria-label="Open team incidents"
          onClick={() => navigate('/team/1st-line-live')}
          title="Open Team Incidents"
          style={{ cursor: 'pointer' }}
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
            {teamData.map((team) => (
              <div
                key={team.label}
                className="team-bar-column"
                onClick={() => handleTeamClick(team.label)}
                title={`View ${team.label} Incidents`}
                style={{ cursor: 'pointer' }}
              >
                <div className="team-bar-plot">
                  <div
                    className="team-bar"
                    style={{
                      height: `${(team.value / maxValue) * 100}%`,
                    }}
                  >
                    <span className="team-bar-number">
                      {team.value}
                    </span>
                  </div>
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