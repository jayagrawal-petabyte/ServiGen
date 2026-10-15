import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import IncidentCard from './components/IncidentCard';
import { majorIncidentsService } from '../../services/majorIncidentsService';
import type { MajorIncident } from './types/majorIncident.types';

const SCR021_MajorIncidentsDesign: React.FC = () => {
  const navigate = useNavigate();
  const [_selectedListId, setSelectedListId] = useState<string>('update-required');
  const [displayedIncidents, setDisplayedIncidents] = useState<MajorIncident[]>([]);

  useEffect(() => {
    majorIncidentsService.getMajorIncidents().then((live) => {
      if (Array.isArray(live)) {
        setDisplayedIncidents(live);
      }
    });
  }, []);
  const totalCount = displayedIncidents.length;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* ── Main Layout (Sidebar + Header + Content) ── */}
      <MajorIncidentsSidebar onSelectList={setSelectedListId} />

      <div className="flex flex-col flex-1 min-w-0">
        
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Major Incidents</span>
            <span className="text-gray-400">&gt;</span>
            <div className="flex items-center gap-1.5 text-gray-900 font-semibold">
              <div className="w-3 h-3 bg-red-500 rounded-sm" />
              Update Required (Design Preview)
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            
            <button
              onClick={() => navigate('/major-incidents/live')}
              className="bg-cyan-400 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              Live Console →
            </button>
            <button
              onClick={() => navigate('/major-incidents/live')}
              className="bg-cyan-400 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="text-lg leading-none">+</span> New Ticket
            </button>

            {/* Icon Group */}
            <div className="flex items-center gap-1.5 ml-2">
              {/* Search */}
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
              
              {/* Bell with badge */}
              <button className="relative w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</div>
              </button>

              {/* Clipboard */}
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </button>
              
              {/* Speedometer */}
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>

              {/* RSS/Wifi */}
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 5.25a13.5 13.5 0 0112 13.5m-9-13.5a9 9 0 018 9m-5-4.5a4.5 4.5 0 014 4.5m-2.5-2.5a2.5 2.5 0 012 2.5" /></svg>
              </button>

              {/* Clock */}
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>

              {/* Question */}
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>

              {/* Profile Avatar */}
              <button className="relative w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center text-white ml-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.76 1.49 5.2 3.8 6.78V21.5a.5.5 0 00.78.41l3.52-2.3c1.23.25 2.53.39 3.9.39 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/></svg>
                <div className="absolute bottom-0 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </button>
            </div>
          </div>
        </header>

        {/* Workspace Area (List) */}
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 shrink-0">
              <button className="w-8 h-8 rounded-full border border-cyan-400 text-cyan-400 flex items-center justify-center bg-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">1–{totalCount} of {totalCount}</span>
                <div className="flex gap-1">
                  <button className="p-1 hover:bg-gray-200 rounded">&lt;</button>
                  <button className="p-1 hover:bg-gray-200 rounded">&gt;</button>
                </div>
                <button className="p-1 text-cyan-500 hover:bg-cyan-50 flex items-center justify-center rounded">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button className="bg-cyan-400 text-white px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                  <span>+</span> New
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">•••</button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {displayedIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SCR021_MajorIncidentsDesign;
