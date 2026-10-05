import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

interface NavItemConfig {
  to: string;
  label: string;
  smallText?: boolean;
  iconPath: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    iconPath: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  },
  {
    to: '/incidents',
    label: 'Incidents',
    iconPath: 'M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z',
  },
  {
    to: '/my-work',
    label: 'My Work',
    iconPath: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  },
  {
    to: '/major-incidents/live',
    label: 'Major Incidents',
    smallText: true,
    iconPath: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  },
  {
    to: '/services-catalogue',
    label: 'Requests',
    iconPath: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-5 9H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V8h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V8h2v2z',
  },
  {
    to: '/change-requests',
    label: 'Change Requests',
    smallText: true,
    iconPath: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
  },
  {
    to: '/projects',
    label: 'Projects',
    iconPath: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z',
  },
  {
    to: '/article-drafts',
    label: 'Article Drafts',
    smallText: true,
    iconPath: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  },
  {
    to: '/calendar',
    label: 'Calendar',
    iconPath: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z',
  },
  {
    to: '/on-hold',
    label: 'On-Hold Tickets',
    smallText: true,
    iconPath: 'M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z',
  },
  {
    to: '/custom-lists',
    label: 'Custom Lists',
    smallText: true,
    iconPath: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  },
  {
    to: '/team/1st-line-live',
    label: 'Team Views',
    iconPath: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  },
  {
    to: '/cmdb',
    label: 'CMDB',
    iconPath: 'M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zm-2 6h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H8v-2h2v2zm10-11H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-2 6h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H8v-2h2v2zM4 1h16c.55 0 1 .45 1 1v3H3V2c0-.55.45-1 1-1z',
  },
  {
    to: '/approvals',
    label: 'My Approvals',
    smallText: true,
    iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="figma-left-sidebar select-none">
      <div className="sidebar-logo">
        <div className="logo-circle" title="Halo AI / ServiGen">
          O
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-nav-link ${isActive ? 'active' : ''}`
            }
            title={item.label}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d={item.iconPath} />
            </svg>
            <span className={`nav-label ${item.smallText ? 'nav-label-sm' : ''}`}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
