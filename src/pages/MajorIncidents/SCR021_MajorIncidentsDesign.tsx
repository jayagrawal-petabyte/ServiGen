/**
 * SCR-021 — Major Incidents with Activity Feed (Design View)
 *
 * This is the main screen component. It:
 *   1. Holds the top-level state (feed open/closed, search query)
 *   2. Fetches / holds the incident data (mock for now)
 *   3. Renders the three-column layout:
 *      [ Sidebar ] | [ Incident List ] | [ Activity Feed ]
 *
 * LEARNING — Component Hierarchy / Data Flow:
 *
 *   SCR021_MajorIncidentsDesign   ← owns state, holds data
 *     ├── MajorIncidentsSidebar   ← receives onSelectList callback
 *     ├── IncidentCard × N        ← receives incident data (read-only)
 *     └── ActivityFeed            ← receives entries + onClose callback
 *
 *   Data flows DOWN as props.
 *   Events flow UP as callbacks (onClose, onSelectList).
 *   This is the core React data-flow pattern — "one-way data binding."
 *
 * LEARNING — useState vs useEffect:
 *   useState  → stores a value that, when changed, causes a re-render
 *   useEffect → runs SIDE EFFECTS after render (e.g. API calls, subscriptions)
 *
 *   Right now we don't need useEffect because the data is static mock data.
 *   In SCR-023 (Live), we'll use useEffect to poll/subscribe for real-time
 *   feed updates.
 */

import React, { useState } from 'react';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import IncidentCard from './components/IncidentCard';
import ActivityFeed from './components/ActivityFeed';
import { MOCK_MAJOR_INCIDENTS, MOCK_FEED_ENTRIES } from './data/mockData';
import type { MajorIncident } from './types/majorIncident.types';

const SCR021_MajorIncidentsDesign: React.FC = () => {
  // ── Local state ────────────────────────────────────────────────────────────

  /** Controls whether the Activity Feed panel is visible */
  const [isFeedOpen, setIsFeedOpen] = useState<boolean>(true);

  /**
   * The currently selected sidebar list ID.
   * In a real app this would filter MOCK_MAJOR_INCIDENTS.
   * We keep it here (in the parent) so both sidebar and list can react.
   */
  const [_selectedListId, setSelectedListId] = useState<string>('update-required');

  // ── Derived data ───────────────────────────────────────────────────────────

  /**
   * In SCR-021 (design view) we show all mock incidents.
   * In SCR-022 (live) we'll filter by selectedListId.
   *
   * LEARNING: Variables derived from state don't need their own useState —
   *   they just re-compute every render. No extra re-renders triggered.
   */
  const displayedIncidents: MajorIncident[] = MOCK_MAJOR_INCIDENTS;
  const totalCount = displayedIncidents.length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    /*
     * Full-height flex container.
     * Tailwind note: h-screen = 100vh, overflow-hidden prevents double
     * scrollbars — the inner panels handle their own overflow.
     */
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

      {/* ── Left sidebar ── */}
      <MajorIncidentsSidebar onSelectList={setSelectedListId} />

      {/* ── Main content area ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ─── Toolbar / Header row ─── */}
        <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
          {/* Left: action buttons */}
          <div className="flex items-center gap-2">
            <button className="bg-orange-400 hover:bg-orange-500 text-white text-xs font-medium px-4 py-1.5 rounded-full transition-colors">
              Get started
            </button>
            <button className="flex items-center gap-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full transition-colors">
              <span className="text-base leading-none">+</span>
              New Ticket
            </button>
          </div>

          {/* Right: notification bell + New button + menu */}
          <div className="flex items-center gap-2">
            <button
              className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            {/* Feed toggle button */}
            <button
              onClick={() => setIsFeedOpen((prev) => !prev)}
              className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <span className="text-base leading-none">+</span>
              New
            </button>

            {/* More options */}
            <button className="text-gray-400 hover:text-gray-600 px-1" aria-label="More options">
              •••
            </button>
          </div>
        </header>

        {/* ─── Content row: incident list + optional feed panel ─── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Incident list column */}
          <div className="flex-1 overflow-y-auto px-5 py-4">

            {/* Pagination / count row */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <button className="hover:text-gray-700">‹</button>
              <span>1–{totalCount} of {totalCount}</span>
              <button className="hover:text-gray-700">›</button>
            </div>

            {/* Incident cards */}
            {displayedIncidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <p className="text-sm">No major incidents found</p>
              </div>
            ) : (
              displayedIncidents.map((incident) => (
                /*
                 * LEARNING — the `key` prop:
                 *   When rendering a list, React needs a unique `key` on each
                 *   element so it can track which items changed/moved/were removed
                 *   efficiently. Always use a stable ID — never use the array index
                 *   as key if the list can be reordered.
                 */
                <IncidentCard key={incident.id} incident={incident} />
              ))
            )}
          </div>

          {/* Activity Feed panel (conditionally rendered) */}
          {isFeedOpen && (
            <ActivityFeed
              entries={MOCK_FEED_ENTRIES}
              onClose={() => setIsFeedOpen(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default SCR021_MajorIncidentsDesign;
