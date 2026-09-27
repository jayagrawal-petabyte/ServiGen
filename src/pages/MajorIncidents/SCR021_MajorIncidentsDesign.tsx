import React, { useState } from 'react';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import IncidentCard from './components/IncidentCard';
import { MOCK_MAJOR_INCIDENTS } from './data/mockData';
import type { MajorIncident } from './types/majorIncident.types';

const SCR021_MajorIncidentsDesign: React.FC = () => {
  const [_selectedListId, setSelectedListId] = useState<string>('update-required');
  const displayedIncidents: MajorIncident[] = MOCK_MAJOR_INCIDENTS;
  const totalCount = displayedIncidents.length;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      
      {/* ── Thin Global Nav (Halo) ── */}
      <nav className="w-16 bg-[#0f172a] flex flex-col items-center py-4 shrink-0 gap-6 z-20 relative">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xl">O</div>
        <div className="flex flex-col gap-4 w-full">
          {[
            { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'My Work' },
            { icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'Incidents' },
            { icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', label: 'Major Incidents', active: true },
            { icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', label: 'Problems' }
          ].map((item, i) => (
            <div key={i} className={`flex flex-col items-center gap-1 cursor-pointer w-full py-2 ${item.active ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
              <span className="text-[9px] text-center px-1 leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </nav>

      {/* ── Main Layout (Header + Content) ── */}
      <div className="flex flex-col flex-1 min-w-0">
        
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Major Incidents</span>
            <span className="text-gray-400">&gt;</span>
            <div className="flex items-center gap-1.5 text-gray-900 font-semibold">
              <div className="w-3 h-3 bg-red-500 rounded-sm" />
              Update Required
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            
            <button className="bg-cyan-400 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors">
              Get started
            </button>
            <button className="bg-cyan-400 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors flex items-center gap-1">
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

        {/* Workspace Area (Sidebar + List) */}
        <div className="flex flex-1 min-h-0">
          <MajorIncidentsSidebar onSelectList={setSelectedListId} />

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
