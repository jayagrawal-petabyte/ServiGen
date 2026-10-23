import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { useAuth } from '../../pages/Auth/AuthContext';
import type { User } from '../../pages/Auth/types';
import './Sidebar.css';

/* ──────────────────────────────────────────────────────────────────────────
   Icon Definitions (Accurately styled to match reference screenshot)
   - Size: 22x22
   - Stroke / Fill: Crisp white
   - Uniform stroke width ~2.2px for outline icons
   ────────────────────────────────────────────────────────────────────────── */

// 1. Dashboard: House with doorway cut out
const DashboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" className={className} aria-hidden="true">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

// 2. My Work: Clipboard with top clip and 3 horizontal lines
const MyWorkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
  </svg>
);

// 3. Incidents: Tilted price/luggage tag with loop thread at top
const IncidentsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" className={className} aria-hidden="true">
    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
    <path d="M6 3.5C5.8 2 4.8 1.2 3.5 1.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 4. Major Incidents: Hollow upright triangle outline
const MajorIncidentsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 3.8L2.5 20.2h19L12 3.8z" />
  </svg>
);

// 5. Problems: Solid upright triangle with question mark cut out
const ProblemsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" className={className} aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      fill="currentColor"
      d="M12 2.5L1.5 21h21L12 2.5zm-.93 8.22c0-.51.41-.93.93-.93.51 0 .93.42.93.93 0 .42-.28.69-.64.96-.53.4-.72.76-.72 1.32v.5h.9v-.45c0-.4.18-.62.59-.94.46-.35.8-.75.8-1.39 0-1.07-.86-1.83-1.86-1.83-1 0-1.83.79-1.83 1.83h.9zm.93 7.08a.7.7 0 1 0 0-1.4.7.7 0 0 0 0 1.4z"
    />
  </svg>
);

// 6. Requests: Shopping cart with wheels
const RequestsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="8" cy="20.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="18" cy="20.5" r="1.5" fill="currentColor" stroke="none" />
    <path d="M2 3h3.5l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h8.8a1.8 1.8 0 0 0 1.7-1.3l2.2-7.8H6.2" />
  </svg>
);

// 7. Change Requests: Two curved circular refresh arrows
const ChangeRequestsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

// 8. Projects: Outline briefcase with top handle and two vertical divider stripes
const ProjectsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3.5" y="7" width="17" height="13.5" rx="2" />
    <path d="M8.5 7V4.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5V7" />
    <line x1="8.5" y1="7" x2="8.5" y2="20.5" />
    <line x1="15.5" y1="7" x2="15.5" y2="20.5" />
  </svg>
);

// 9. Article Drafts: Bookmark ribbon outline with notch
const ArticleDraftsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

// 10. Calendar: Calendar with binder rings at top
const CalendarNavIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect width="18" height="17" x="3" y="4" rx="2.5" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

// 11. Organisations: Two people outline
const OrganisationsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="3.5" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a3.5 3.5 0 0 1 0 6.75" />
  </svg>
);

// 12. CMDB: 3 stacked database discs
const CmdbIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <ellipse cx="12" cy="5.5" rx="8.5" ry="3" />
    <path d="M3.5 5.5v13a8.5 3 0 0 0 17 0v-13" />
    <path d="M3.5 12a8.5 3 0 0 0 17 0" />
  </svg>
);

// 13. Contacts: ID badge / contact notebook with spiral pins at top and person inside
const ContactsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3.5" y="4.5" width="17" height="16.5" rx="2.5" />
    <circle cx="12" cy="11.5" r="2.8" />
    <path d="M7.5 21v-1.8a2.2 2.2 0 0 1 2.2-2.2h4.6a2.2 2.2 0 0 1 2.2 2.2V21" />
    <line x1="8" y1="2" x2="8" y2="4.5" />
    <line x1="16" y1="2" x2="16" y2="4.5" />
  </svg>
);

// 14. My Approvals: Shield outline with checkmark
const MyApprovalsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

/* ──────────────────────────────────────────────────────────────────────────
   Navigation Items Configuration
   Exact order:
   1. Dashboard
   2. My Work
   3. Incidents
   4. Major Incidents
   5. Problems
   6. Requests
   7. Change Requests
   8. Projects
   9. Article Drafts
   10. Calendar
   11. Organisations
   12. CMDB
   13. Contacts
   14. My Approvals

   RBAC Filter:
   - Items with roles restricted according to QA-RBAC-01
   - End User ('user001') hides administrative menus: CMDB, Change Requests, Organisations, Article Drafts, Problems, Major Incidents, Approvals.
   - Administrator retains full access to all 14 items.
   ────────────────────────────────────────────────────────────────────────── */

export interface NavItemConfig {
  to: string;
  label: string;
  line1?: string;
  line2?: string;
  icon: React.ComponentType<{ className?: string }>;
  matchActive?: (pathname: string) => boolean;
  roles?: User['role'][];
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
    matchActive: (path) => path === '/' || path === '/dashboard',
  },
  {
    to: '/my-work',
    label: 'My Work',
    icon: MyWorkIcon,
    matchActive: (path) => path.startsWith('/my-work'),
  },
  {
    to: '/incidents',
    label: 'Incidents',
    icon: IncidentsIcon,
    matchActive: (path) => path === '/incidents' || path.startsWith('/team'),
  },
  {
    to: '/major-incidents/live',
    label: 'Major Incidents',
    line1: 'Major',
    line2: 'Incidents',
    icon: MajorIncidentsIcon,
    matchActive: (path) => path.startsWith('/major-incidents'),
    roles: ['Administrator', 'System Manager', 'Team Lead', 'Support Agent'],
  },
  {
    to: '/problems',
    label: 'Problems',
    icon: ProblemsIcon,
    matchActive: (path) => path.startsWith('/problems'),
    roles: ['Administrator', 'System Manager', 'Team Lead', 'Support Agent'],
  },
  {
    to: '/requests',
    label: 'Requests',
    icon: RequestsIcon,
    matchActive: (path) => path.startsWith('/requests') || path.startsWith('/services-catalogue'),
  },
  {
    to: '/change-requests',
    label: 'Change Requests',
    line1: 'Change',
    line2: 'Requests',
    icon: ChangeRequestsIcon,
    matchActive: (path) => path.startsWith('/change-requests'),
    roles: ['Administrator', 'System Manager', 'Team Lead', 'Support Agent'],
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: ProjectsIcon,
    matchActive: (path) => path.startsWith('/projects'),
    roles: ['Administrator', 'System Manager', 'Team Lead', 'Support Agent'],
  },
  {
    to: '/article-drafts',
    label: 'Article Drafts',
    line1: 'Article',
    line2: 'Drafts',
    icon: ArticleDraftsIcon,
    matchActive: (path) => path.startsWith('/article-drafts'),
    roles: ['Administrator', 'System Manager', 'Team Lead', 'Support Agent'],
  },
  {
    to: '/calendar',
    label: 'Calendar',
    icon: CalendarNavIcon,
    matchActive: (path) => path.startsWith('/calendar'),
  },
  {
    to: '/organisations',
    label: 'Organisations',
    icon: OrganisationsIcon,
    matchActive: (path) => path === '/organisations',
    roles: ['Administrator', 'System Manager'],
  },
  {
    to: '/cmdb',
    label: 'CMDB',
    icon: CmdbIcon,
    matchActive: (path) => path.startsWith('/cmdb'),
    roles: ['Administrator', 'System Manager', 'Team Lead', 'Support Agent'],
  },
  {
    to: '/contacts',
    label: 'Contacts',
    icon: ContactsIcon,
    matchActive: (path) => path.startsWith('/contacts'),
  },
  {
    to: '/approvals',
    label: 'My Approvals',
    line1: 'My',
    line2: 'Approvals',
    icon: MyApprovalsIcon,
    matchActive: (path) => path.startsWith('/approvals'),
    roles: ['Administrator', 'System Manager', 'Team Lead'],
  },
];

const PREFETCH_MAP: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('../../pages/Dashboard/Dashboard'),
  '/my-work': () => import('../../pages/MyWork/MyWork'),
  '/incidents': () => import('../../pages/Incidents'),
  '/major-incidents/live': () => import('../../pages/MajorIncidents'),
  '/problems': () => import('../../pages/Incidents'),
  '/requests': () => import('../../pages/Requests/RequestsPage'),
  '/change-requests': () => import('../../pages/ChangeRequests/ChangeRequestsPage'),
  '/projects': () => import('../../pages/Projects/ProjectsPage'),
  '/article-drafts': () => import('../../pages/ArticleDrafts/ArticleDraftsPage'),
  '/calendar': () => import('../../pages/Calendar/CalendarPage'),
  '/organisations': () => import('../../pages/Auth'),
  '/cmdb': () => import('../../pages/CMDB/CmdbPage'),
  '/contacts': () => import('../../pages/Auth'),
  '/approvals': () => import('../../pages/Approvals/ApprovalsPage'),
};

const prefetchRoute = (to: string) => {
  const loader = PREFETCH_MAP[to];
  if (loader) {
    try {
      loader();
    } catch {}
  }
};

export interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({ mobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const { user } = useAuth();
  const currentRole: User['role'] = user?.role || 'Administrator';

  // QA-RBAC-01: Filter sidebar items by user role.
  // Administrators see all items. End users are restricted from CMDB, Change Requests, Organisations, Article Drafts, etc.
  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.includes(currentRole);
    });
  }, [currentRole]);

  return (
    <aside className={`figma-left-sidebar select-none ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Logo */}
      <div className="sidebar-logo">
        <NavLink
          to="/dashboard"
          onClick={onCloseMobile}
          onMouseEnter={() => prefetchRoute('/dashboard')}
          onFocus={() => prefetchRoute('/dashboard')}
          className="flex items-center justify-center transition-transform hover:scale-105"
          style={{ textDecoration: 'none' }}
          title="ServiGen Dashboard"
        >
          <BrandLogo size={32} />
        </NavLink>
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden absolute right-2 text-white/70 hover:text-white p-1 rounded-md"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Vertically Stacked Navigation Items */}
      <nav className="sidebar-nav">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchActive
            ? item.matchActive(location.pathname)
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              onMouseEnter={() => prefetchRoute(item.to)}
              onFocus={() => prefetchRoute(item.to)}
              className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
              title={item.label}
              data-active={isActive ? 'true' : undefined}
            >
              <Icon className="sidebar-nav-icon" />
              {item.line1 ? (
                <span className="nav-label">
                  <span>{item.line1}</span>
                  <span>{item.line2}</span>
                </span>
              ) : (
                <span className="nav-label">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
});

export default Sidebar;
