import React, { useState } from 'react';
import {
  Clock,
  Sliders,
  Grid3X3,
  GitBranch,
  FormInput,
  ShieldCheck,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  AlertCircle,
  Layers,
  Settings,
  HelpCircle,
  Lock,
} from 'lucide-react';
import './AdminSettings.css';

type AdminTab = 'sla' | 'categories' | 'matrix' | 'workflows' | 'fields' | 'roles';

interface SlaRule {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  responseTargetMinutes: number;
  resolutionTargetHours: number;
  businessHoursOnly: boolean;
  escalateAtPercent: number;
}

interface TicketCategoryItem {
  id: string;
  name: string;
  department: string;
  assignedTeam: string;
  slaTier: 'Standard' | 'Expedited' | 'Mission-Critical';
  active: boolean;
}

export const AdminSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('sla');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. SLA Policy Configuration State
  const [slaRules, setSlaRules] = useState<SlaRule[]>([
    { priority: 'Critical', responseTargetMinutes: 15, resolutionTargetHours: 2, businessHoursOnly: false, escalateAtPercent: 75 },
    { priority: 'High', responseTargetMinutes: 30, resolutionTargetHours: 4, businessHoursOnly: false, escalateAtPercent: 80 },
    { priority: 'Medium', responseTargetMinutes: 60, resolutionTargetHours: 12, businessHoursOnly: true, escalateAtPercent: 85 },
    { priority: 'Low', responseTargetMinutes: 120, resolutionTargetHours: 48, businessHoursOnly: true, escalateAtPercent: 90 },
  ]);

  // 2. Category Taxonomy State
  const [categories, setCategories] = useState<TicketCategoryItem[]>([
    { id: 'CAT-01', name: 'Network & Global VPN Access', department: 'Infrastructure', assignedTeam: '1st Line Support', slaTier: 'Expedited', active: true },
    { id: 'CAT-02', name: 'Hardware & Laptop Provisioning', department: 'End User Computing', assignedTeam: '2nd Line Specialists', slaTier: 'Standard', active: true },
    { id: 'CAT-03', name: 'Database & Cloud Storage', department: 'Data Platform', assignedTeam: 'DevOps / Platform', slaTier: 'Mission-Critical', active: true },
    { id: 'CAT-04', name: 'Software & License Fulfillment', department: 'IT Procurement', assignedTeam: '1st Line Support', slaTier: 'Standard', active: true },
    { id: 'CAT-05', name: 'Access Control & SSO Identity', department: 'Cybersecurity', assignedTeam: 'Security Operations', slaTier: 'Expedited', active: true },
  ]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatTeam, setNewCatTeam] = useState('1st Line Support');

  // 3. Priority Matrix Configuration State: [Impact][Urgency]
  // 0: High, 1: Medium, 2: Low
  const [priorityMatrix, setPriorityMatrix] = useState<string[][]>([
    ['Critical', 'High', 'Medium'],   // High Impact
    ['High', 'Medium', 'Low'],        // Medium Impact
    ['Medium', 'Low', 'Low'],         // Low Impact
  ]);

  // 4. Workflow Rules State
  const [workflowGuards, setWorkflowGuards] = useState({
    requireRootCauseOnResolve: true,
    requireCabApprovalForProdChanges: true,
    requireRollbackTestForCritical: true,
    allowDirectClosureByAgent: false,
    autoNotifyRequesterOnStatusChange: true,
  });

  // 5. Custom Form Fields
  const [customFields, setCustomFields] = useState([
    { id: 'fld-1', label: 'Impacted Site / Data Center', type: 'Dropdown', required: true, module: 'Incidents' },
    { id: 'fld-2', label: 'Vendor Ticket External Reference', type: 'Text', required: false, module: 'Incidents' },
    { id: 'fld-3', label: 'Staging Verification Runbook URL', type: 'URL', required: true, module: 'Change Requests' },
    { id: 'fld-4', label: 'Hardware Serial Number / Asset Tag', type: 'Text', required: true, module: 'Requests' },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpdateSla = (priority: SlaRule['priority'], field: keyof SlaRule, value: any) => {
    setSlaRules((prev) =>
      prev.map((r) => (r.priority === priority ? { ...r, [field]: value } : r))
    );
  };

  const handleCycleMatrix = (impactIdx: number, urgencyIdx: number) => {
    const cycle = ['Critical', 'High', 'Medium', 'Low'];
    const current = priorityMatrix[impactIdx][urgencyIdx];
    const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
    const nextVal = cycle[nextIdx];

    setPriorityMatrix((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[impactIdx][urgencyIdx] = nextVal;
      return copy;
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCat: TicketCategoryItem = {
      id: `CAT-0${categories.length + 1}`,
      name: newCatName.trim(),
      department: 'Corporate IT',
      assignedTeam: newCatTeam,
      slaTier: 'Standard',
      active: true,
    };
    setCategories((prev) => [...prev, newCat]);
    setNewCatName('');
    showToast(`Added ticket category: "${newCat.name}"`);
  };

  const handleToggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  return (
    <div className="admin-settings-canvas">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-toast-banner">
          ✓ {toastMessage}
        </div>
      )}

      {/* Top Navbar */}
      <header className="admin-header">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Administration</span>
          <span>/</span>
          <span className="text-gray-900">System Configuration &amp; Governance</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            <span>Admin Control Panel (Halo Parity)</span>
          </span>
        </div>
      </header>

      {/* Page Title & Subtitle */}
      <div className="admin-title-area">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#eb6a47]/10 text-[#eb6a47] rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Platform Settings &amp; Process Customization</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure ITIL process engines, SLA targets, category hierarchies, priority matrix, and role authorization rules.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-nav-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('sla')}
          className={`admin-nav-btn ${activeTab === 'sla' ? 'active' : ''}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>SLA Policies &amp; Targets</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`admin-nav-btn ${activeTab === 'categories' ? 'active' : ''}`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Ticket Categories</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`admin-nav-btn ${activeTab === 'matrix' ? 'active' : ''}`}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>Priority Calculation Matrix</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('workflows')}
          className={`admin-nav-btn ${activeTab === 'workflows' ? 'active' : ''}`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Workflow Transitions &amp; Guards</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fields')}
          className={`admin-nav-btn ${activeTab === 'fields' ? 'active' : ''}`}
        >
          <FormInput className="w-3.5 h-3.5" />
          <span>Dynamic Custom Fields</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`admin-nav-btn ${activeTab === 'roles' ? 'active' : ''}`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Role Permissions (RBAC)</span>
        </button>
      </div>

      {/* Main Settings Panel */}
      <main className="admin-main-panel">
        {/* TAB 1: SLA Policies */}
        {activeTab === 'sla' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Service Level Agreement (SLA) Policy Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">Define target response and resolution durations for each incident priority tier</p>
              </div>
              <button
                type="button"
                onClick={() => showToast('SLA Policy rules saved and applied to active tickets.')}
                className="admin-save-btn"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save SLA Policies</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slaRules.map((rule) => (
                <div key={rule.priority} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                      rule.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                      rule.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                      rule.priority === 'Medium' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {rule.priority} Priority SLA
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.businessHoursOnly}
                        onChange={(e) => handleUpdateSla(rule.priority, 'businessHoursOnly', e.target.checked)}
                        className="rounded text-[#eb6a47]"
                      />
                      <span>Business Hours Only (9-5)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">First Response Target (min)</label>
                      <input
                        type="number"
                        value={rule.responseTargetMinutes}
                        onChange={(e) => handleUpdateSla(rule.priority, 'responseTargetMinutes', parseInt(e.target.value) || 15)}
                        className="admin-input-box"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Resolution Target (hours)</label>
                      <input
                        type="number"
                        value={rule.resolutionTargetHours}
                        onChange={(e) => handleUpdateSla(rule.priority, 'resolutionTargetHours', parseInt(e.target.value) || 2)}
                        className="admin-input-box"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Escalation Alert Threshold:</span>
                    <span className="font-bold text-slate-700">Trigger at {rule.escalateAtPercent}% elapsed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Categories */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Service Desk Taxonomy &amp; Categories</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure ticket categorization hierarchies and routing destinations</p>
              </div>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[240px]">
                <label className="block text-xs font-bold text-slate-700 mb-1">New Category Title</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Mobile Device Management (MDM)"
                  className="admin-input-box"
                  required
                />
              </div>
              <div className="w-48">
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Support Team</label>
                <select
                  value={newCatTeam}
                  onChange={(e) => setNewCatTeam(e.target.value)}
                  className="admin-input-box bg-white"
                >
                  <option value="1st Line Support">1st Line Support</option>
                  <option value="2nd Line Specialists">2nd Line Specialists</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Security Operations">Security Operations</option>
                </select>
              </div>
              <button type="submit" className="admin-save-btn">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </form>

            {/* Category Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Default Handling Team</th>
                    <th className="py-3 px-4">SLA Tier</th>
                    <th className="py-3 px-4 text-center">Active Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-slate-600">{cat.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{cat.name}</td>
                      <td className="py-3 px-4 text-slate-600">{cat.department}</td>
                      <td className="py-3 px-4 font-semibold text-indigo-700">{cat.assignedTeam}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                          {cat.slaTier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            cat.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {cat.active ? 'Active ✓' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Priority Calculation Matrix */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">ITIL Priority Calculation Matrix (Impact × Urgency)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Click any matrix cell to cycle through assigned priority levels</p>
              </div>
              <button
                type="button"
                onClick={() => showToast('Priority Matrix updated successfully.')}
                className="admin-save-btn"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Matrix</span>
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs max-w-xl">
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                <div className="p-3" />
                <div className="p-3 bg-slate-100 rounded-lg text-slate-700">High Urgency</div>
                <div className="p-3 bg-slate-100 rounded-lg text-slate-700">Medium Urgency</div>
                <div className="p-3 bg-slate-100 rounded-lg text-slate-700">Low Urgency</div>

                {['High Impact', 'Medium Impact', 'Low Impact'].map((impactLabel, impactIdx) => (
                  <React.Fragment key={impactLabel}>
                    <div className="p-3 bg-slate-100 rounded-lg text-slate-700 text-left flex items-center">
                      {impactLabel}
                    </div>
                    {[0, 1, 2].map((urgencyIdx) => {
                      const priority = priorityMatrix[impactIdx][urgencyIdx];
                      return (
                        <button
                          key={urgencyIdx}
                          type="button"
                          onClick={() => handleCycleMatrix(impactIdx, urgencyIdx)}
                          className={`p-4 rounded-xl font-bold transition-transform hover:scale-105 cursor-pointer shadow-xs ${
                            priority === 'Critical' ? 'bg-rose-500 text-white' :
                            priority === 'High' ? 'bg-amber-500 text-white' :
                            priority === 'Medium' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {priority}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Workflow Transitions & Guards */}
        {activeTab === 'workflows' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">ITIL Process Workflow Validation &amp; Guard Rules</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enforce operational governance and required audit steps</p>
              </div>
              <button
                type="button"
                onClick={() => showToast('Workflow guard rules updated.')}
                className="admin-save-btn"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Guards</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              {[
                { key: 'requireRootCauseOnResolve', label: 'Require Root Cause Analysis on Problem Closure', desc: 'Enforces documenting a verified root cause category before a problem ticket can transition to Resolved.' },
                { key: 'requireCabApprovalForProdChanges', label: 'Require Formal CAB Approval for Production RFCs', desc: 'Prevents moving normal and high-risk changes to Implementation without positive CAB voting quorum.' },
                { key: 'requireRollbackTestForCritical', label: 'Enforce Verified Rollback Plan for Critical Releases', desc: 'Changes flagged as Critical must provide executable backout scripts and verification procedures.' },
                { key: 'allowDirectClosureByAgent', label: 'Allow Immediate Direct Closure by Support Agents', desc: 'When disabled, resolved tickets enter a 48-hour customer verification holding period before auto-closing.' },
                { key: 'autoNotifyRequesterOnStatusChange', label: 'Auto-Dispatch Email Notifications on Workflow Steps', desc: 'Sends email updates to ticket requesters whenever status transitions from Triage to In Progress or Resolved.' },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{item.label}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(workflowGuards as any)[item.key]}
                    onChange={(e) => setWorkflowGuards((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#eb6a47] focus:ring-0 cursor-pointer mt-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Dynamic Custom Fields */}
        {activeTab === 'fields' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Custom Form Fields Builder</h3>
                <p className="text-xs text-slate-500 mt-0.5">Extend standard ticket forms with custom operational attributes</p>
              </div>
              <button
                type="button"
                onClick={() => showToast('Custom form field schema published.')}
                className="admin-save-btn"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Publish Schema</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4">Field ID</th>
                    <th className="py-3 px-4">Field Label</th>
                    <th className="py-3 px-4">Input Type</th>
                    <th className="py-3 px-4">Target Module</th>
                    <th className="py-3 px-4 text-center">Mandatory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customFields.map((fld) => (
                    <tr key={fld.id}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-600">{fld.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{fld.label}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                          {fld.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{fld.module}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          fld.required ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {fld.required ? 'Required *' : 'Optional'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: Role Permissions (RBAC) */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Role-Based Access Control (RBAC) Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">Verified permissions per user role across all 14 service desk modules</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4">ITSM Module</th>
                    <th className="py-3 px-4 text-center">Administrator</th>
                    <th className="py-3 px-4 text-center">System Manager</th>
                    <th className="py-3 px-4 text-center">Team Lead</th>
                    <th className="py-3 px-4 text-center">Support Agent</th>
                    <th className="py-3 px-4 text-center">End User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { module: 'Incidents & Tickets', admin: 'Full', mgr: 'Full', lead: 'Full', agent: 'Assigned', user: 'Own Tickets' },
                    { module: 'Major Incidents Command', admin: 'Full', mgr: 'Full', lead: 'View/Join', agent: 'View Only', user: 'Restricted' },
                    { module: 'Change Requests & CAB', admin: 'Full', mgr: 'Vote CAB', lead: 'Vote CAB', agent: 'View Only', user: 'Restricted' },
                    { module: 'CMDB & Topology', admin: 'Full', mgr: 'Full', lead: 'Read/Link', agent: 'Read Only', user: 'Restricted' },
                    { module: 'My Approvals Queue', admin: 'Full', mgr: 'Approve', lead: 'Approve', agent: 'Restricted', user: 'Restricted' },
                    { module: 'End-User Portal', admin: 'Full', mgr: 'Full', lead: 'Full', agent: 'Full', user: 'Primary Hub' },
                    { module: 'System Admin Settings', admin: 'Full', mgr: 'Full', lead: 'Restricted', agent: 'Restricted', user: 'Restricted' },
                  ].map((row) => (
                    <tr key={row.module} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-800">{row.module}</td>
                      <td className="py-3 px-4 text-center"><span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">{row.admin}</span></td>
                      <td className="py-3 px-4 text-center"><span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">{row.mgr}</span></td>
                      <td className="py-3 px-4 text-center"><span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">{row.lead}</span></td>
                      <td className="py-3 px-4 text-center"><span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">{row.agent}</span></td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          row.user === 'Restricted' ? 'bg-rose-50 text-rose-600' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {row.user}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSettingsPage;
