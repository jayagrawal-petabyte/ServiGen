import React, { useState } from 'react';
import { ServiceCisPage } from './pages/CMDB/ServiceCisPage';
import { CmdbPage } from './pages/CMDB/CmdbPage';
import { ChangeRequestsPage } from './pages/ChangeRequests/ChangeRequestsPage';
import { CreateChangeModal } from './pages/ChangeRequests/CreateChangeModal';
import { ChangeRequestDetailModal } from './pages/ChangeRequests/ChangeRequestDetailModal';
import type { ChangeRequest } from './types/cmdb';

export function App() {
  const [activeTab, setActiveTab] = useState<'serviceCis' | 'cmdb' | 'changeRequests'>('changeRequests');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChangeRequest, setSelectedChangeRequest] = useState<ChangeRequest | null>(null);

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FD]">
      {/* Top Navigation */}
      <header className="bg-[#1B254B] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-lg text-[#E87A5D]">Halo AI</span>
          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300 font-semibold">
            Module 10: CMDB & Change Requests
          </span>
        </div>

        <nav className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('changeRequests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'changeRequests' ? 'bg-[#E87A5D] text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Change Requests
          </button>
          <button
            onClick={() => setActiveTab('cmdb')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'cmdb' ? 'bg-[#E87A5D] text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            CMDB CIs Directory
          </button>
          <button
            onClick={() => setActiveTab('serviceCis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'serviceCis' ? 'bg-[#E87A5D] text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Service CIs (Live)
          </button>
        </nav>
      </header>

      {/* Main Content View */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'changeRequests' && (
          <ChangeRequestsPage
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onSelectChangeRequest={(cr) => setSelectedChangeRequest(cr)}
          />
        )}
        {activeTab === 'cmdb' && <CmdbPage />}
        {activeTab === 'serviceCis' && <ServiceCisPage />}
      </main>

      {/* Interactive Modals */}
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
