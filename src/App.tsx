import React, { useState } from 'react';
import ApprovalsPage from './pages/Approvals/ApprovalsPage';
import ArticleDraftsPage from './pages/ArticleDrafts/ArticleDraftsPage';
import { ServiceCisPage } from './pages/CMDB/ServiceCisPage';
import { CmdbPage } from './pages/CMDB/CmdbPage';
import { ChangeRequestsPage } from './pages/ChangeRequests/ChangeRequestsPage';
import { CreateChangeModal } from './pages/ChangeRequests/CreateChangeModal';
import { ChangeRequestDetailModal } from './pages/ChangeRequests/ChangeRequestDetailModal';
import type { ChangeRequest } from './types/cmdb';

export function App() {
  const [activeTab, setActiveTab] = useState<
    'approvals' | 'articleDrafts' | 'changeRequests' | 'cmdb' | 'serviceCis'
  >('approvals');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChangeRequest, setSelectedChangeRequest] =
    useState<ChangeRequest | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-[#faf6f2]">
      {/* Top Application Header */}
      <header className="bg-[#131d2b] text-white px-6 py-3.5 flex flex-wrap items-center justify-between shadow-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#eb6a47] to-[#f7a58b] flex items-center justify-center font-bold text-white text-sm shadow">
            S
          </div>
          <div>
            <span className="font-extrabold text-base text-[#eb6a47]">ServiGen</span>
            <span className="text-xs text-slate-400 ml-2 font-medium">Halo AI Enterprise</span>
          </div>
        </div>

        {/* Global Module Switcher */}
        <nav className="flex items-center gap-1.5 flex-wrap my-1">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-[#eb6a47] text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            My Approvals
          </button>

          <button
            onClick={() => setActiveTab('articleDrafts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'articleDrafts'
                ? 'bg-[#eb6a47] text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Article Drafts
          </button>

          <span className="text-slate-600 px-1">|</span>

          <button
            onClick={() => setActiveTab('changeRequests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'changeRequests'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Change Requests
          </button>

          <button
            onClick={() => setActiveTab('cmdb')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'cmdb'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            CMDB Directory
          </button>

          <button
            onClick={() => setActiveTab('serviceCis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'serviceCis'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Service CIs
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#f6aa93] flex items-center justify-center text-xs font-bold text-white shadow">
            AS
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'approvals' && (
          <div className="flex-1 overflow-y-auto w-full">
            <ApprovalsPage />
          </div>
        )}

        {activeTab === 'articleDrafts' && (
          <div className="flex-1 overflow-hidden w-full">
            <ArticleDraftsPage />
          </div>
        )}

        {activeTab === 'changeRequests' && (
          <div className="flex-1 overflow-hidden w-full">
            <ChangeRequestsPage
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onSelectChangeRequest={(cr) => setSelectedChangeRequest(cr)}
            />
          </div>
        )}

        {activeTab === 'cmdb' && (
          <div className="flex-1 overflow-hidden w-full">
            <CmdbPage />
          </div>
        )}

        {activeTab === 'serviceCis' && (
          <div className="flex-1 overflow-hidden w-full">
            <ServiceCisPage />
          </div>
        )}
      </main>

      {/* Modals for team member components */}
      <CreateChangeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={() => setIsCreateModalOpen(false)}
      />

      <ChangeRequestDetailModal
        changeRequest={selectedChangeRequest}
        onClose={() => setSelectedChangeRequest(null)}
      />
    </div>
  );
}

export default App;
