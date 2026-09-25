import React from 'react';
import './Team.css';

const Team: React.FC = () => {
  return (
    <div className="team-view-container">
      <div className="coming-soon-box">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <h2>Tickets by Team</h2>
        <p>This view is currently under construction and will be coming soon!</p>
      </div>
    </div>
  );
};

export default Team;
