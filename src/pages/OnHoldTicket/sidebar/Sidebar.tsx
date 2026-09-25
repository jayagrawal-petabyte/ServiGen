import React from 'react';
import './Sidebar.css';

interface NavItem {
  icon: string;
  label: string;
  active?: boolean;
}

const Sidebar: React.FC = () => {
  const primaryItems: NavItem[] = [
    { icon: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z", label: "My Work", active: true },
  ];

  return (
    <aside className="left-sidebar">
      <div className="sidebar-logo">
        <div className="logo-circle">O</div>
      </div>
      <nav className="sidebar-nav">
        {primaryItems.map((item) => (
          <div key={item.label} className={"nav-item" + (item.active ? " active" : "")}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d={item.icon}/></svg>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}

        <div className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
          <span className="nav-label">Incidents</span>
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
          <span className="nav-label nav-label-sm">Major Incidents</span>
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <span className="nav-label">Problems</span>
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-5 9H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V8h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V8h2v2z"/></svg>
          <span className="nav-label">Requests</span>
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
          <span className="nav-label nav-label-sm">Change Requests</span>
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>
          <span className="nav-label">Projects</span>
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          <span className="nav-label nav-label-sm">Article Drafts</span>
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
          <span className="nav-label">Calendar</span>
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 0H4v2h16V0zM4 24h16v-2H4v2zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25S13.24 11.25 12 11.25 9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/></svg>
          <span className="nav-label nav-label-sm">Organisations</span>
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zm-2 6h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H8v-2h2v2zm10-11H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-2 6h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H8v-2h2v2zM4 1h16c.55 0 1 .45 1 1v3H3V2c0-.55.45-1 1-1z"/></svg>
          <span className="nav-label">CMDB</span>
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
          <span className="nav-label">Contacts</span>
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          <span className="nav-label nav-label-sm">My Approvals</span>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
