import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ConfigurationItem, CiRelationship, CiSoftwareLicense } from '../../types/cmdb';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getCiStatusVariant } from '../../utils/statusUtils';
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
  Clock,
  Layers,
  ArrowRight,
  ArrowDown,
  AlertCircle,
  ExternalLink,
  Plus,
  Cpu,
  Key,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface CiDetailModalProps {
  ci: ConfigurationItem | null;
  onClose: () => void;
  onOpenCreateChange?: (ci: ConfigurationItem) => void;
}

export const CiDetailModal: React.FC<CiDetailModalProps> = ({
  ci,
  onClose,
  onOpenCreateChange,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'specs' | 'relationships' | 'impact' | 'licenses'>('specs');

  if (!ci) return null;

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
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col"
      >
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 rounded-t-3xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
              {getCiIcon(ci.type)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-mono font-extrabold text-[#eb6a47]">{ci.tag}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  {ci.type}
                </span>
                <StatusBadge label={ci.status} variant={getCiStatusVariant(ci.status)} />
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {ci.lifecycleState || 'Deployed'}
                </span>
                {ci.criticality && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {ci.criticality}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{ci.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Context Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 mx-6 mt-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Site Location</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{ci.site}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Technical Owner</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{ci.technicalContact}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Environment</span>
            <span className="font-bold text-slate-800">{ci.environment}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">IP Address</span>
            <span className="font-mono font-bold text-slate-800">{ci.ipAddress || ci.specifications?.ipAddress || 'DHCP Pool'}</span>
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
            Specifications & Asset Info
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
            Topology & Dependencies ({ci.relationships?.length || 0})
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
            Impact Analysis & Tickets
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
            Software Licences ({ci.softwareLicenses?.length || 0})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700 flex-1">
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Operating System & Compute
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">OS Platform:</span>
                      <span className="font-semibold text-slate-800">{ci.specifications?.os || 'Linux Enterprise'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CPU Allocation:</span>
                      <span className="font-semibold text-slate-800">{ci.specifications?.cpu || '16 vCPU'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Memory (RAM):</span>
                      <span className="font-semibold text-slate-800">{ci.specifications?.ram || '64 GB'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Storage Volume:</span>
                      <span className="font-semibold text-slate-800">{ci.specifications?.storage || '1 TB SSD'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Hardware & Data Center Specs
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hardware Model:</span>
                      <span className="font-semibold text-slate-800">{ci.specifications?.model || 'Enterprise Rackmount'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rack Location:</span>
                      <span className="font-semibold text-slate-800">{ci.specifications?.rackLocation || 'Rack A-02'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">MAC Address:</span>
                      <span className="font-mono text-slate-700">{ci.specifications?.macAddress || '00:1A:2B:3C:4D:5E'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Discovery Method:</span>
                      <span className="font-semibold text-slate-800">Automated Agent &amp; SNMP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asset Lifecycle Pipeline */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  ITIL Asset Lifecycle State Machine
                </span>
                <div className="flex items-center justify-between text-xs font-semibold">
                  {['Ordered', 'In Stock', 'Deployed', 'Maintenance', 'Retired'].map((step, idx) => {
                    const isCurrent = (ci.lifecycleState || 'Deployed') === step;
                    return (
                      <div key={step} className="flex items-center gap-1">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isCurrent
                              ? 'bg-[#eb6a47] text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-500'
                          }`}
                        >
                          {step}
                        </span>
                        {idx < 4 && <span className="text-slate-300 font-bold">→</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'relationships' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h4 className="font-bold text-sm text-slate-900 mb-1">CI Dependency & Topology Map</h4>
                <p className="text-slate-500 text-xs mb-4">
                  Visual topology mapping relationships and operational dependencies across the infrastructure stack.
                </p>

                {ci.relationships && ci.relationships.length > 0 ? (
                  <div className="space-y-3">
                    {ci.relationships.map((rel: CiRelationship, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs"
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
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase">
                          {rel.direction}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-semibold text-slate-600">Standard standalone component</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Direct connections route via default network subnet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'impact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-sm">Active Incidents</span>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-bold text-xs">
                      {ci.activeIncidentsCount}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    Incidents currently affecting or reported against this configuration item.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/incidents?ci=${encodeURIComponent(ci.id)}&ciName=${encodeURIComponent(ci.name)}`);
                    }}
                    className="w-full py-1.5 bg-white hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-300 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>View Incidents Queue</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 text-sm">Linked Change Requests</span>
                    <span className="px-2 py-0.5 bg-purple-200 text-purple-900 rounded-full font-bold text-xs">
                      {ci.linkedChangesCount}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    Scheduled changes or pending implementations involving this CI.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/change-requests?ci=${encodeURIComponent(ci.id)}&ciName=${encodeURIComponent(ci.name)}`);
                    }}
                    className="w-full py-1.5 bg-white hover:bg-purple-100 text-purple-800 font-bold rounded-xl border border-purple-300 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>View Change Requests</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons to raise incident or change for this CI */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-700 text-xs">Need to schedule maintenance or report an outage?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/change-requests?openCreate=true&ciId=${encodeURIComponent(ci.tag)}&ciName=${encodeURIComponent(ci.name)}`);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#eb6a47] hover:bg-[#db5936] text-white font-bold text-xs cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Raise Change for this CI</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'licenses' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-900">Software Licences & Contract Entitlements</h4>
                </div>
                <p className="text-slate-500 text-xs">
                  Software licences, vendor maintenance entitlements, and enterprise seats allocated to this asset.
                </p>

                {ci.softwareLicenses && ci.softwareLicenses.length > 0 ? (
                  <div className="space-y-2">
                    {ci.softwareLicenses.map((lic: CiSoftwareLicense, idx: number) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{lic.name}</span>
                          <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            {lic.licenseKeyMasked}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Expiry: <strong>{lic.expiryDate}</strong></span>
                          <span>Allocated Seats: <strong>{lic.seatsAllocated} of {lic.seatsTotal}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="font-semibold text-slate-600">Standard Open-Source / Bundled Licence</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">No proprietary third-party commercial licence required.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-3xl text-xs text-slate-500">
          <span>Asset Tag: <strong className="font-mono text-slate-800">{ci.tag}</strong></span>
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
