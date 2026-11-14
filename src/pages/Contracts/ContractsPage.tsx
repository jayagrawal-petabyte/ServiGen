import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  ExternalLink,
  Building2,
  Calendar,
  DollarSign,
  X,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import {
  contractsService,
  ContractItem,
  ContractType,
  ContractStatus,
} from '../../services/contractsService';

const CONTRACT_TYPES: ContractType[] = [
  'SLA',
  'Maintenance',
  'License',
  'Underpinning',
  'Warranty',
  'Support',
  'Other',
];

const CONTRACT_STATUSES: ContractStatus[] = [
  'Draft',
  'Active',
  'Pending Renewal',
  'Expired',
  'Terminated',
];

export const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Contract Form State
  const [newTitle, setNewTitle] = useState('');
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newType, setNewType] = useState<ContractType>('License');
  const [newStatus, setNewStatus] = useState<ContractStatus>('Active');
  const [newValue, setNewValue] = useState<number>(0);
  const [newCurrency, setNewCurrency] = useState('GBP');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newEndDate, setNewEndDate] = useState('');
  const [newRenewalDate, setNewRenewalDate] = useState('');
  const [newAutoRenew, setNewAutoRenew] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadContracts = async () => {
    setIsLoading(true);
    try {
      const data = await contractsService.getContracts();
      setContracts(data);
    } catch {
      // offline / mock fallback handles it
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const expiringSoonContracts = useMemo(() => {
    return contracts.filter(
      (c) => c.daysUntilExpiry !== null && c.daysUntilExpiry !== undefined && c.daysUntilExpiry > 0 && c.daysUntilExpiry <= 60
    );
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (typeFilter !== 'All' && c.contractType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesVendor = c.vendorName.toLowerCase().includes(q);
        const matchesId = c.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesVendor && !matchesId) return false;
      }
      return true;
    });
  }, [contracts, statusFilter, typeFilter, searchQuery]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newVendorName.trim()) {
      showToast('Title and Vendor Name are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await contractsService.createContract({
        title: newTitle.trim(),
        vendorName: newVendorName.trim(),
        vendorEmail: newVendorEmail.trim() || null,
        contractType: newType,
        status: newStatus,
        value: Number(newValue) || 0,
        currency: newCurrency,
        startDate: newStartDate ? new Date(newStartDate).toISOString() : new Date().toISOString(),
        endDate: newEndDate ? new Date(newEndDate).toISOString() : null,
        renewalDate: newRenewalDate ? new Date(newRenewalDate).toISOString() : null,
        autoRenew: newAutoRenew,
        notes: newNotes.trim() || null,
      });
      setContracts((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      showToast(`Contract ${created.id} created successfully!`);
      // Reset form
      setNewTitle('');
      setNewVendorName('');
      setNewVendorEmail('');
      setNewNotes('');
      setNewValue(0);
    } catch (err: any) {
      showToast(err.message || 'Failed to create contract.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending Renewal':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Expired':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getTypeBadge = (type: ContractType) => {
    switch (type) {
      case 'SLA':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'License':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Underpinning':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Maintenance':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Warranty':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col bg-[#FAF7F5] overflow-y-auto font-sans select-text">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between shrink-0 z-30 min-h-[50px] sticky top-0 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-slate-900 font-extrabold">Contracts &amp; SLAs</span>
        </div>

        <GlobalNavbarActions
          onGetStarted={() => {}}
          onNewTicket={() => setIsCreateModalOpen(true)}
          onOpenTicket={() => {}}
        />
      </header>

      {/* Main Content Area */}
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Title & Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-[#eb6a47]" />
              Contracts &amp; Supplier Agreements
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage enterprise vendor agreements, SLA commitments, hardware warranties, and software subscriptions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadContracts}
              className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Refresh Contracts"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#eb6a47] hover:bg-[#d65736] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Contract</span>
            </button>
          </div>
        </div>

        {/* Expiry Warning Banner (if any expiring in <=60 days) */}
        {expiringSoonContracts.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-amber-900">
                {expiringSoonContracts.length} Contract{expiringSoonContracts.length > 1 ? 's' : ''} Expiring Within 60 Days
              </h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Review renewal terms with vendors before automated lapse or unexpected service disruption.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {expiringSoonContracts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContract(c)}
                    className="text-[10px] font-bold bg-white text-amber-800 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>{c.vendorName} ({c.daysUntilExpiry}d left)</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick status tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['All', 'Active', 'Pending Renewal', 'Expired'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#eb6a47] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {st}
                {st === 'All' && ` (${contracts.length})`}
                {st === 'Active' && ` (${contracts.filter((c) => c.status === 'Active').length})`}
                {st === 'Pending Renewal' && ` (${contracts.filter((c) => c.status === 'Pending Renewal').length})`}
                {st === 'Expired' && ` (${contracts.filter((c) => c.status === 'Expired').length})`}
              </button>
            ))}
          </div>

          {/* Search & Type filter */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor or agreement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#eb6a47] focus:ring-1 focus:ring-[#eb6a47]/20 w-52 text-slate-800"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#eb6a47] cursor-pointer"
            >
              <option value="All">All Types</option>
              {CONTRACT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contracts Grid / Cards */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-400 text-xs">
            <p className="animate-pulse">Loading enterprise contracts...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">No contracts found</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              No contracts matched your current filters. Try resetting the status or type filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map((c) => {
              const isExpired = c.daysUntilExpiry !== null && c.daysUntilExpiry !== undefined && c.daysUntilExpiry <= 0;
              const isUrgent = c.daysUntilExpiry !== null && c.daysUntilExpiry !== undefined && c.daysUntilExpiry > 0 && c.daysUntilExpiry <= 30;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedContract(c)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-[#eb6a47]/40 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {c.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeBadge(c.contractType)}`}>
                          {c.contractType}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(c.status)}`}>
                          {c.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#eb6a47] transition-colors line-clamp-2">
                      {c.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium truncate">{c.vendorName}</span>
                    </div>

                    {c.notes && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {c.notes}
                      </p>
                    )}
                  </div>

                  {/* Footer Stats */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Annual Value:</span>
                      <span className="font-bold text-slate-900">
                        {c.value > 0 ? `${c.currency} ${c.value.toLocaleString()}` : 'Included / Free'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Expiry:</span>
                      <span
                        className={`font-semibold ${
                          isExpired
                            ? 'text-rose-600 font-bold'
                            : isUrgent
                            ? 'text-amber-600 font-bold'
                            : 'text-slate-700'
                        }`}
                      >
                        {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Perpetual'}
                        {c.daysUntilExpiry !== null && c.daysUntilExpiry !== undefined && (
                          <span className="ml-1 text-[10px] opacity-75">
                            ({c.daysUntilExpiry > 0 ? `${c.daysUntilExpiry}d left` : 'Expired'})
                          </span>
                        )}
                      </span>
                    </div>

                    {c.autoRenew && (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>Auto-renewal active</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-slate-400">
                  {selectedContract.id}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedContract.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContract(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Vendor</span>
                  <span className="font-bold text-slate-800">{selectedContract.vendorName}</span>
                  {selectedContract.vendorEmail && (
                    <span className="text-[11px] text-slate-500 block">{selectedContract.vendorEmail}</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Contract Type</span>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${getTypeBadge(selectedContract.contractType)}`}>
                    {selectedContract.contractType}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${getStatusBadge(selectedContract.status)}`}>
                    {selectedContract.status}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Contract Value</span>
                  <span className="font-bold text-slate-800">
                    {selectedContract.value > 0 ? `${selectedContract.currency} ${selectedContract.value.toLocaleString()}` : 'Included'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Timeline</span>
                <div className="flex items-center justify-between text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Start Date</span>
                    <span className="font-semibold">{new Date(selectedContract.startDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">End Date</span>
                    <span className="font-semibold">{selectedContract.endDate ? new Date(selectedContract.endDate).toLocaleDateString() : 'Perpetual'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Renewal</span>
                    <span className="font-semibold">{selectedContract.renewalDate ? new Date(selectedContract.renewalDate).toLocaleDateString() : 'None'}</span>
                  </div>
                </div>
              </div>

              {selectedContract.notes && (
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Coverage &amp; SLA Notes</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed whitespace-pre-line">
                    {selectedContract.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Contract Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#eb6a47]" />
                Register New Agreement / Contract
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Contract / Agreement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cisco SmartNet 24x7 Core Switching"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#eb6a47]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Vendor / Provider *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cisco Systems"
                    value={newVendorName}
                    onChange={(e) => setNewVendorName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#eb6a47]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Vendor Contact Email</label>
                  <input
                    type="email"
                    placeholder="support@vendor.com"
                    value={newVendorEmail}
                    onChange={(e) => setNewVendorEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#eb6a47]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contract Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ContractType)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#eb6a47] cursor-pointer"
                  >
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ContractStatus)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#eb6a47] cursor-pointer"
                  >
                    {CONTRACT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Value Amount</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#eb6a47]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Currency</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#eb6a47] cursor-pointer"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#eb6a47]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">End / Expiry Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#eb6a47]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoRenewCheck"
                  checked={newAutoRenew}
                  onChange={(e) => setNewAutoRenew(e.target.checked)}
                  className="rounded border-slate-300 text-[#eb6a47] focus:ring-[#eb6a47]"
                />
                <label htmlFor="autoRenewCheck" className="text-slate-700 font-medium">
                  Auto-Renew contract at period expiration
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">SLA Target &amp; Coverage Notes</label>
                <textarea
                  rows={3}
                  placeholder="Detail 4-hour response SLAs, warranty numbers, serial scopes, or renewal contacts..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#eb6a47] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#eb6a47] hover:bg-[#d65736] rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsPage;
