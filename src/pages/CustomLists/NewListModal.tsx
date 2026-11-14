import React, { useState } from 'react';
import { Save, Share2 } from 'lucide-react';
import { ModalShell } from '../../components/shared/ModalShell';
import { SegmentedTabs } from '../../components/shared/SegmentedTabs';

interface NewListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (listData: any) => void;
}

export const NewListModal: React.FC<NewListModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'filters'>('details');
  const [listName, setListName] = useState('');
  const [useArea, setUseArea] = useState('Tickets (All Areas)');
  const [listGroup, setListGroup] = useState('');
  const [sequence, setSequence] = useState(30);
  const [showTreeviewCounts, setShowTreeviewCounts] = useState(false);
  const [columnProfile, setColumnProfile] = useState('*Use Default Column Profile (No Override)*');
  const [listDisplayType, setListDisplayType] = useState('Default');
  const [showFreezePeriods, setShowFreezePeriods] = useState(false);
  const [showInByTeamView, setShowInByTeamView] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        listName,
        useArea,
        listGroup,
        sequence,
        showTreeviewCounts,
        columnProfile,
        listDisplayType,
        showFreezePeriods,
        showInByTeamView,
      });
    }
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      icon={<span className="font-bold text-base">≡</span>}
      title="New List"
      description="Configure custom query, display format, and visibility preferences"
      headerActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-3.5 py-1.5 bg-[#C96F55] hover:bg-[#b85e44] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer rounded-lg hover:bg-slate-100"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div>
        <div className="px-6 pt-3 pb-0 border-b border-slate-200 bg-white">
          <SegmentedTabs
            tabs={[
              { id: 'details', label: 'Details' },
              { id: 'filters', label: 'Filters' },
            ]}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as 'details' | 'filters')}
            variant="underline"
            theme="terracotta"
            ariaLabel="List view tabs"
          />
        </div>

        <div className="p-6 bg-white space-y-5 text-xs text-slate-700">
          {activeTab === 'details' ? (
            <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  List Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="Enter a name for this List here"
                  className="w-full px-3.5 py-2.5 bg-white border border-sky-400 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                />
                <button type="button" className="text-sky-600 text-[11px] font-semibold mt-1 flex items-center gap-1 hover:underline cursor-pointer">
                  ⊕ Add translations
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Use <span className="text-red-500">*</span>
                </label>
                <select
                  value={useArea}
                  onChange={(e) => setUseArea(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="Tickets (All Areas)">Tickets (All Areas)</option>
                  <option value="Change Requests">Change Requests</option>
                  <option value="CMDB Items">CMDB Items</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  List Group <span className="text-red-500">*</span>
                </label>
                <select
                  value={listGroup}
                  onChange={(e) => setListGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="">Select...</option>
                  <option value="My Work">My Work</option>
                  <option value="My Projects">My Projects</option>
                  <option value="Change Management">Change Management</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Sequence in lists <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={sequence}
                  onChange={(e) => setSequence(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showTreeviewCounts"
                  checked={showTreeviewCounts}
                  onChange={(e) => setShowTreeviewCounts(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="showTreeviewCounts" className="font-semibold text-slate-700 cursor-pointer">
                  Show counts in Treeview
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Column Profile <span className="text-red-500">*</span>
                </label>
                <select
                  value={columnProfile}
                  onChange={(e) => setColumnProfile(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="*Use Default Column Profile (No Override)*">
                    *Use Default Column Profile (No Override)*
                  </option>
                  <option value="CMDB Detailed Profile">CMDB Detailed Profile</option>
                  <option value="Change Request Audit Profile">Change Request Audit Profile</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">List display type</label>
                <select
                  value={listDisplayType}
                  onChange={(e) => setListDisplayType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="Default">Default</option>
                  <option value="Grid View">Grid View</option>
                  <option value="Kanban Board">Kanban Board</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showFreezePeriods"
                    checked={showFreezePeriods}
                    onChange={(e) => setShowFreezePeriods(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="showFreezePeriods" className="font-semibold text-slate-700 cursor-pointer">
                    Show change freeze periods and maintenance windows in the calendar view
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showInByTeamView"
                    checked={showInByTeamView}
                    onChange={(e) => setShowInByTeamView(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="showInByTeamView" className="font-semibold text-slate-700 cursor-pointer">
                    Show in the "By Team" view
                  </label>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <p className="font-semibold">Filter Criteria Configuration</p>
              <p className="text-xs text-slate-400 mt-1">Configure automated rules and metadata criteria for this custom list view.</p>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
};
