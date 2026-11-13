import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type {
  ConfigurationItem,
  CiRelationship,
  CiSoftwareLicense,
  CiLifecycleState,
} from '../../types/cmdb';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getCiStatusVariant } from '../../utils/statusUtils';
import {
  updateConfigurationItem,
  addCiRelationship,
  deleteCiRelationship,
  fetchCiTopology,
  type CiTopologyGraph,
} from '../../services/cmdbService';
import { CiVisualTopologyTree } from './CiVisualTopologyTree';
import {
  X,
  Server,
  Database,
  Network,
  Cloud,
  Shield,
  HardDrive,
  MapPin,
  User,
  Layers,
  AlertCircle,
  ExternalLink,
  Plus,
  Cpu,
  Key,
  Trash2,
  GitBranch,
  Check,
  Edit3,
  Loader2,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface CiDetailModalProps {
  ci: ConfigurationItem | null;
  allCis?: ConfigurationItem[];
  onClose: () => void;
  onOpenCreateChange?: (ci: ConfigurationItem) => void;
  onUpdateCi?: (updated: ConfigurationItem) => void;
}

export const CiDetailModal: React.FC<CiDetailModalProps> = ({
  ci,
  allCis = [],
  onClose,
  onUpdateCi,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'specs' | 'relationships' | 'impact' | 'licenses'>('specs');
  const [currentCi, setCurrentCi] = useState<ConfigurationItem | null>(ci);

  // Specifications editing state
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [specForm, setSpecForm] = useState({
    os: '',
    cpu: '',
    ram: '',
    storage: '',
    model: '',
    rackLocation: '',
    warrantyExpiry: '',
  });

  const getWarrantyInfo = (dateStr?: string) => {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    if (isNaN(expiry.getTime())) return null;
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Expired (${expiry.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })})`,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        diffDays,
      };
    }
    if (diffDays <= 90) {
      return {
        label: `Warranty: ${diffDays}d left`,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        diffDays,
      };
    }
    return {
      label: `Warranty: ${expiry.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      diffDays,
    };
  };

  // Relationships & Topology state
  const [showAddRel, setShowAddRel] = useState(false);
  const [relTargetId, setRelTargetId] = useState('');
  const [relType, setRelType] = useState<'depends_on' | 'runs_on' | 'backed_up_by' | 'connected_to'>('depends_on');
  const [relDirection, setRelDirection] = useState<'downstream' | 'upstream'>('downstream');
  const [isLinkingRel, setIsLinkingRel] = useState(false);
  const [showTopology, setShowTopology] = useState(true);
  const [topologyGraph, setTopologyGraph] = useState<CiTopologyGraph | null>(null);
  const [isLoadingTopology, setIsLoadingTopology] = useState(false);

  // Status & Lifecycle update loading
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    setCurrentCi(ci);
    if (ci?.specifications || ci?.warrantyExpiry) {
      setSpecForm({
        os: ci?.specifications?.os || '',
        cpu: ci?.specifications?.cpu || '',
        ram: ci?.specifications?.ram || '',
        storage: ci?.specifications?.storage || '',
        model: ci?.specifications?.model || '',
        rackLocation: ci?.specifications?.rackLocation || '',
        warrantyExpiry: ci?.warrantyExpiry || ci?.specifications?.warrantyExpiry || '',
      });
    }
    if (ci?.id) {
      fetchCiTopology(ci.id)
        .then((res) => setTopologyGraph(res.data))
        .catch(() => {});
    }
  }, [ci]);

  if (!currentCi) return null;

  const showFeedback = (text: string, isError = false) => {
    setActionMessage({ text, isError });
    setTimeout(() => setActionMessage(null), 3500);
  };

  const getCiIcon = (type: string) => {
    switch (type) {
      case 'Database':
        return <Database className="w-5 h-5 text-indigo-500" />;
      case 'Network':
        return <Network className="w-5 h-5 text-emerald-500" />;
      case 'Cloud Service':
        return <Cloud className="w-5 h-5 text-sky-500" />;
      case 'Security':
        return <Shield className="w-5 h-5 text-rose-500" />;
      case 'Server':
        return <HardDrive className="w-5 h-5 text-amber-500" />;
      default:
        return <Server className="w-5 h-5 text-slate-500" />;
    }
  };

  const lifecycleStages: CiLifecycleState[] = ['Ordered', 'In Stock', 'Deployed', 'Maintenance', 'Retired'];

  const handleUpdateLifecycle = async (newLifecycle: CiLifecycleState) => {
    if (newLifecycle === currentCi.lifecycleState || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateConfigurationItem(currentCi.id, {
        lifecycleState: newLifecycle,
      });
      const updated = res.data;
      setCurrentCi(updated);
      onUpdateCi?.(updated);
      showFeedback(`Lifecycle updated to ${newLifecycle}`);
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to update lifecycle stage', true);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    try {
      const res = await updateConfigurationItem(currentCi.id, {
        warrantyExpiry: specForm.warrantyExpiry || undefined,
        specifications: {
          ...(currentCi.specifications || {}),
          ...specForm,
        },
      });
      const updated = res.data;
      setCurrentCi(updated);
      onUpdateCi?.(updated);
      setIsEditingSpecs(false);
      showFeedback('Specifications updated successfully');
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to update specifications', true);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relTargetId || isLinkingRel) return;

    setIsLinkingRel(true);
    try {
      const res = await addCiRelationship(currentCi.id, {
        targetId: relTargetId,
        type: relType,
        direction: relDirection,
      });

      const updatedRels = res.data;
      const updatedCi: ConfigurationItem = {
        ...currentCi,
        relationships: updatedRels,
      };

      setCurrentCi(updatedCi);
      onUpdateCi?.(updatedCi);
      setShowAddRel(false);
      setRelTargetId('');
      showFeedback('Relationship established successfully');

      if (showTopology) {
        loadTopology();
      }
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to establish relationship', true);
    } finally {
      setIsLinkingRel(false);
    }
  };

  const handleRemoveRelationship = async (targetId: string) => {
    try {
      const res = await deleteCiRelationship(currentCi.id, targetId);
      const updatedRels = res.data;
      const updatedCi: ConfigurationItem = {
        ...currentCi,
        relationships: updatedRels,
      };

      setCurrentCi(updatedCi);
      onUpdateCi?.(updatedCi);
      showFeedback('Relationship removed');

      if (showTopology) {
        loadTopology();
      }
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to remove relationship', true);
    }
  };

  const loadTopology = async () => {
    setIsLoadingTopology(true);
    try {
      const res = await fetchCiTopology(currentCi.id);
      setTopologyGraph(res.data);
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to fetch topology graph', true);
    } finally {
      setIsLoadingTopology(false);
    }
  };

  const toggleTopologyView = () => {
    const nextState = !showTopology;
    setShowTopology(nextState);
    if (nextState && !topologyGraph) {
      loadTopology();
    }
  };

  const availableTargetCis = allCis.filter(
    (item) => item.id !== currentCi.id && item.tag !== currentCi.tag
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 rounded-t-3xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
              {getCiIcon(currentCi.type)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-mono font-extrabold text-[#eb6a47]">{currentCi.tag}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  {currentCi.type}
                </span>
                <StatusBadge label={currentCi.status} variant={getCiStatusVariant(currentCi.status)} />
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {currentCi.lifecycleState || 'Deployed'}
                </span>
                {currentCi.criticality && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {currentCi.criticality}
                  </span>
                )}
                {(() => {
                  const wInfo = getWarrantyInfo(currentCi.warrantyExpiry || currentCi.specifications?.warrantyExpiry);
                  if (!wInfo) return null;
                  return (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border flex items-center gap-1 ${wInfo.badgeClass}`}>
                      <ShieldCheck className="w-3 h-3" />
                      {wInfo.label}
                    </span>
                  );
                })()}
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{currentCi.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message banner */}
        {actionMessage && (
          <div
            className={`mx-6 mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              actionMessage.isError
                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}
          >
            {actionMessage.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Check className="w-4 h-4 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Overview attributes card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 mx-6 mt-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Site Location</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{currentCi.site}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Technical Owner</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{currentCi.technicalContact}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Environment</span>
            <span className="font-bold text-slate-800">{currentCi.environment}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">IP Address</span>
            <span className="font-mono font-bold text-slate-800">
              {currentCi.ipAddress || currentCi.specifications?.ipAddress || 'DHCP Pool'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'specs'
                ? 'border-[#eb6a47] text-[#eb6a47]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Specifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('relationships')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'relationships'
                ? 'border-[#eb6a47] text-[#eb6a47]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Dependencies ({currentCi.relationships?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('impact')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'impact'
                ? 'border-[#eb6a47] text-[#eb6a47]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Impact & Tickets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('licenses')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'licenses'
                ? 'border-[#eb6a47] text-[#eb6a47]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Licences ({currentCi.softwareLicenses?.length || 0})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-5 text-xs text-slate-700 flex-1">
          {/* TAB 1: Specifications & Lifecycle */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Hardware & System Configuration
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingSpecs(!isEditingSpecs)}
                  className="px-3 py-1 text-xs font-bold text-[#eb6a47] hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingSpecs ? 'Cancel' : 'Edit Specs'}</span>
                </button>
              </div>

              {isEditingSpecs ? (
                <form onSubmit={handleSaveSpecs} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Operating System</label>
                      <input
                        type="text"
                        value={specForm.os}
                        onChange={(e) => setSpecForm({ ...specForm, os: e.target.value })}
                        placeholder="e.g. Ubuntu Linux 22.04 LTS"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">CPU Cores</label>
                      <input
                        type="text"
                        value={specForm.cpu}
                        onChange={(e) => setSpecForm({ ...specForm, cpu: e.target.value })}
                        placeholder="e.g. 16 vCPU"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">RAM / Memory</label>
                      <input
                        type="text"
                        value={specForm.ram}
                        onChange={(e) => setSpecForm({ ...specForm, ram: e.target.value })}
                        placeholder="e.g. 64 GB"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Storage Allocation</label>
                      <input
                        type="text"
                        value={specForm.storage}
                        onChange={(e) => setSpecForm({ ...specForm, storage: e.target.value })}
                        placeholder="e.g. 1 TB NVMe SSD"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Model / Chassis</label>
                      <input
                        type="text"
                        value={specForm.model}
                        onChange={(e) => setSpecForm({ ...specForm, model: e.target.value })}
                        placeholder="e.g. Dell PowerEdge R750"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Rack Location</label>
                      <input
                        type="text"
                        value={specForm.rackLocation}
                        onChange={(e) => setSpecForm({ ...specForm, rackLocation: e.target.value })}
                        placeholder="e.g. Rack B-14, U10-U12"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Warranty Expiration</label>
                      <input
                        type="date"
                        value={specForm.warrantyExpiry}
                        onChange={(e) => setSpecForm({ ...specForm, warrantyExpiry: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingSpecs(false)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingStatus}
                      className="px-4 py-1.5 bg-[#eb6a47] hover:bg-[#db5936] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Operating System & Compute
                    </span>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">OS:</span>
                        <span className="font-semibold text-slate-800">{currentCi.specifications?.os || 'Linux Enterprise'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">CPU:</span>
                        <span className="font-semibold text-slate-800">{currentCi.specifications?.cpu || '16 vCPU'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Memory:</span>
                        <span className="font-semibold text-slate-800">{currentCi.specifications?.ram || '64 GB'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Storage:</span>
                        <span className="font-semibold text-slate-800">{currentCi.specifications?.storage || '1 TB SSD'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hardware & Location
                    </span>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Model:</span>
                        <span className="font-semibold text-slate-800">{currentCi.specifications?.model || 'Enterprise Rackmount'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rack Location:</span>
                        <span className="font-semibold text-slate-800">{currentCi.specifications?.rackLocation || 'Rack A-02'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">MAC Address:</span>
                        <span className="font-mono text-slate-700">{currentCi.specifications?.macAddress || '00:1A:2B:3C:4D:5E'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Warranty & Support
                    </span>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Expiry Date:</span>
                        <span className="font-semibold text-slate-800">
                          {currentCi.warrantyExpiry || currentCi.specifications?.warrantyExpiry || 'Dec 31, 2028'}
                        </span>
                      </div>
                      {(() => {
                        const wInfo = getWarrantyInfo(currentCi.warrantyExpiry || currentCi.specifications?.warrantyExpiry);
                        if (!wInfo) return null;
                        return (
                          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60">
                            <span className="text-slate-500">Coverage:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${wInfo.badgeClass}`}>
                              {wInfo.label}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Lifecycle Stage Transition */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Lifecycle Stage
                  </span>
                  <span className="text-[11px] text-slate-400">Click a stage to transition</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold flex-wrap gap-1">
                  {lifecycleStages.map((step, idx) => {
                    const isCurrent = (currentCi.lifecycleState || 'Deployed') === step;
                    return (
                      <div key={step} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateLifecycle(step)}
                          disabled={isUpdatingStatus}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-[#eb6a47] text-white shadow-xs ring-2 ring-[#eb6a47]/30'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {step}
                        </button>
                        {idx < lifecycleStages.length - 1 && <span className="text-slate-300 font-bold">→</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Dependencies & Topology */}
          {activeTab === 'relationships' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Dependencies & Topology</h4>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Upstream and downstream connections for this configuration item.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleTopologyView}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                        showTopology
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>{showTopology ? 'Hide Graph' : 'Topology Graph'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddRel(!showAddRel)}
                      className="px-3 py-1.5 bg-[#eb6a47] hover:bg-[#db5936] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddRel ? 'Cancel' : 'Link CI'}</span>
                    </button>
                  </div>
                </div>

                {/* Add Relationship Form */}
                {showAddRel && (
                  <form
                    onSubmit={handleAddRelationship}
                    className="p-4 mb-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3"
                  >
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Link Dependency to {currentCi.tag}
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Target Configuration Item
                        </label>
                        <select
                          required
                          value={relTargetId}
                          onChange={(e) => setRelTargetId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs"
                        >
                          <option value="">Select target CI...</option>
                          {availableTargetCis.map((item) => (
                            <option key={item.id} value={item.tag || item.id}>
                              {item.tag} - {item.name} ({item.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Relationship Type
                        </label>
                        <select
                          value={relType}
                          onChange={(e) => setRelType(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold"
                        >
                          <option value="depends_on">depends_on</option>
                          <option value="runs_on">runs_on</option>
                          <option value="backed_up_by">backed_up_by</option>
                          <option value="connected_to">connected_to</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Direction
                        </label>
                        <select
                          value={relDirection}
                          onChange={(e) => setRelDirection(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold"
                        >
                          <option value="downstream">downstream (Target depends on this CI)</option>
                          <option value="upstream">upstream (This CI depends on Target)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddRel(false)}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLinkingRel || !relTargetId}
                        className="px-4 py-1.5 bg-[#eb6a47] hover:bg-[#db5936] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isLinkingRel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>Establish Link</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Interactive Visual Topology Tree */}
                {showTopology && (
                  <div className="mb-4">
                    <CiVisualTopologyTree
                      rootCi={currentCi}
                      topologyGraph={topologyGraph}
                      allCis={allCis}
                      isLoading={isLoadingTopology}
                      onRefresh={loadTopology}
                      onSelectCi={(targetId) => {
                        const found = allCis.find((c) => c.id === targetId || c.tag === targetId);
                        if (found) setCurrentCi(found);
                      }}
                      onLinkRelationship={async (targetId, type, direction) => {
                        const res = await addCiRelationship(currentCi.id, {
                          targetId,
                          type: type as any,
                          direction,
                        });
                        const updatedCi: ConfigurationItem = {
                          ...currentCi,
                          relationships: res.data,
                        };
                        setCurrentCi(updatedCi);
                        onUpdateCi?.(updatedCi);
                        loadTopology();
                      }}
                      onUnlinkRelationship={async (targetId) => {
                        const res = await deleteCiRelationship(currentCi.id, targetId);
                        const updatedCi: ConfigurationItem = {
                          ...currentCi,
                          relationships: res.data,
                        };
                        setCurrentCi(updatedCi);
                        onUpdateCi?.(updatedCi);
                        loadTopology();
                      }}
                    />
                  </div>
                )}

                {/* Direct Dependencies List */}
                {currentCi.relationships && currentCi.relationships.length > 0 ? (
                  <div className="space-y-3">
                    {currentCi.relationships.map((rel: CiRelationship, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold bg-slate-100 text-slate-700">
                            {rel.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{rel.targetCiName}</span>
                            <span className="font-mono text-slate-400 text-[10px]">{rel.targetCiTag}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase">
                            {rel.direction}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRelationship(rel.targetCiTag || rel.targetCiId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Unlink dependency"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-semibold text-slate-600">Standalone component</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No direct upstream or downstream dependencies configured.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Impact & Tickets */}
          {activeTab === 'impact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-sm">Active Incidents</span>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-bold text-xs">
                      {currentCi.activeIncidentsCount}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    Incidents currently affecting or reported against this configuration item.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(
                        `/incidents?ci=${encodeURIComponent(currentCi.id)}&ciName=${encodeURIComponent(currentCi.name)}`
                      );
                    }}
                    className="w-full py-1.5 bg-white hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-300 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>View Incidents</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 text-sm">Linked Change Requests</span>
                    <span className="px-2 py-0.5 bg-purple-200 text-purple-900 rounded-full font-bold text-xs">
                      {currentCi.linkedChangesCount}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    Scheduled changes or pending implementations involving this CI.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(
                        `/change-requests?ci=${encodeURIComponent(currentCi.id)}&ciName=${encodeURIComponent(currentCi.name)}`
                      );
                    }}
                    className="w-full py-1.5 bg-white hover:bg-purple-100 text-purple-800 font-bold rounded-xl border border-purple-300 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>View Change Requests</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-700 text-xs">
                  Need to schedule maintenance for this CI?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(
                      `/change-requests?openCreate=true&ciId=${encodeURIComponent(
                        currentCi.tag
                      )}&ciName=${encodeURIComponent(currentCi.name)}`
                    );
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#eb6a47] hover:bg-[#db5936] text-white font-bold text-xs cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Change Request</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Software Licenses */}
          {activeTab === 'licenses' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-900">Software Licences</h4>
                </div>
                <p className="text-slate-500 text-xs">
                  Active software licences and allocations for this asset.
                </p>

                {currentCi.softwareLicenses && currentCi.softwareLicenses.length > 0 ? (
                  <div className="space-y-2">
                    {currentCi.softwareLicenses.map((lic: CiSoftwareLicense, idx: number) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{lic.name}</span>
                          <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            {lic.licenseKeyMasked}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            Expiry: <strong>{lic.expiryDate}</strong>
                          </span>
                          <span>
                            Allocated Seats:{' '}
                            <strong>
                              {lic.seatsAllocated} of {lic.seatsTotal}
                            </strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="font-semibold text-slate-600">Standard / Open-Source Licence</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No proprietary third-party commercial licence required.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-3xl text-xs text-slate-500">
          <span>
            Asset Tag: <strong className="font-mono text-slate-800">{currentCi.tag}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
