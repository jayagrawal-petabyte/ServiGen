import React, { useState } from 'react';
import type { ConfigurationItem, CiType } from '../../types/cmdb';
import { mockConfigurationItems } from '../../data/mockCmdbData';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getCiStatusVariant } from '../../utils/statusUtils';
import { Server, Database, Network, Shield, Cloud, HardDrive, MapPin, User } from 'lucide-react';

interface CmdbPageProps {
  configurationItems?: ConfigurationItem[];
  searchQuery?: string;
}

export const CmdbPage: React.FC<CmdbPageProps> = ({
  configurationItems = mockConfigurationItems,
  searchQuery = '',
}) => {
  const items = configurationItems.length > 0 ? configurationItems : mockConfigurationItems;
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredCis = items.filter((ci) => {
    const matchesSearch =
      ci.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ci.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ci.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ci.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ci.businessOwner.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'ALL' || ci.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || ci.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getCiIcon = (type: CiType) => {
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
        return <Server className="w-5 h-5 text-[#E87A5D]" />;
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#F8F9FD] select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            CMDB Configuration Items (CIs)
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            CMDB: Asset registry, infrastructure mapping, site locations, and technical owners
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1 uppercase">CI Type:</span>
          {['ALL', 'Cloud Service', 'Database', 'Network', 'Application', 'Server'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                selectedType === type
                  ? 'bg-[#1B254B] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Deprecated">Deprecated</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCis.map((ci) => (
          <div
            key={ci.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    {getCiIcon(ci.type)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{ci.name}</h3>
                    <span className="text-xs text-[#E87A5D] font-mono font-bold">{ci.id}</span>
                  </div>
                </div>
                <StatusBadge label={ci.status} variant={getCiStatusVariant(ci.status)} size="sm" />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
                  {ci.tag}
                </span>
                <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold rounded-full">
                  {ci.environment}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 mb-4 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Site Location
                  </span>
                  <span className="font-bold text-slate-800">{ci.site}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Business Owner
                  </span>
                  <span className="font-bold text-slate-800">{ci.businessOwner}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Tech Contact
                  </span>
                  <span className="font-semibold text-slate-700">{ci.technicalContact}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-[10px]">
                  Incidents: {ci.activeIncidentsCount}
                </span>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-md font-bold text-[10px]">
                  Changes: {ci.linkedChangesCount}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{ci.lastUpdated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
