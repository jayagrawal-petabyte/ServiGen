import React, { useState } from 'react';
import './MyList.css';

type IconType = "list" | "agent" | "team" | "type" | "status" | "search";

interface ViewItem {
  label: string;
  icon: IconType;
}

const VIEW_ITEMS: ViewItem[] = [
  { label: "My Lists", icon: "list" },
  { label: "Tickets by Agent", icon: "agent" },
  { label: "Tickets by Team", icon: "team" },
  { label: "Tickets by Type", icon: "type" },
  { label: "Tickets by Status", icon: "status" },
  { label: "All Tickets", icon: "search" },
];

interface MyListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

const MyList: React.FC<MyListProps> = ({ searchQuery, setSearchQuery, activeView, setActiveView }) => {

  const renderIcon = (icon: IconType, fill: string): React.ReactElement => {
    const props = { viewBox: "0 0 24 24", width: 15, height: 15, fill, style: { flexShrink: 0 as const } };
    switch (icon) {
      case "list":   return <svg {...props}><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" /></svg>;
      case "agent":  return <svg {...props}><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>;
      case "team":   return <svg {...props}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>;
      case "type":   return <svg {...props}><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z" /></svg>;
      case "status": return <svg {...props}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>;
      case "search": return <svg {...props}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>;
    }
  };

  return (
    <div className="left-panel">
      <div className="search-bar-row">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search Tickets..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <div className="panel-my-lists-row">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="#0ea5e9">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
        </svg>
        <span className="my-lists-text">My Lists</span>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ marginLeft: 4 }}>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <span className="collapse-arrow">«</span>
        <button className="close-x-btn">?</button>
      </div>
      <div className="select-view-heading">Select a View</div>
      <ul className="view-list">
        {VIEW_ITEMS.map(({ label, icon }) => {
          const isActive = activeView === label;
          const iconFill = isActive ? "white" : "#64748b";
          return (
            <li key={label} className={"view-item" + (isActive ? " view-item-active" : "")} onClick={() => setActiveView(label)}>
              {renderIcon(icon, iconFill)}
              <span style={{ marginLeft: 8 }}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MyList;
