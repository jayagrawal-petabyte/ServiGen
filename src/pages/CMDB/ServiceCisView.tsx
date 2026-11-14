import React, { useState, useEffect, useCallback } from 'react';
import type { ServiceCI } from '../../types/cmdb';
import { fetchServiceCis } from '../../services/cmdbService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { RefreshButton } from '../../components/shared/RefreshButton';
import { getServiceHealthVariant } from '../../utils/statusUtils';
import { defaultServiceCis } from './cmdbData';
import {
  CheckCircle,
  Activity,
  Layers,
  AlertCircle,
  Server,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface ServiceCisViewProps {
  onSelectCi?: (ciId: string) => void;
  onNavigateToInventory?: () => void;
  searchFilter?: string;
}

export const ServiceCisView: React.FC<ServiceCisViewProps> = ({
  onNavigateToInventory,
  searchFilter = '',
}) => {
  const [items, setItems] = useState<ServiceCI[]>(defaultServiceCis);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState<string>('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchServiceCis();
      if (res?.data && res.data.length > 0) {
        setItems(res.data);
      } else {
        setItems(defaultServiceCis);
      }
    } catch {
      setItems(defaultServiceCis);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const effectiveSearch = (searchFilter || localSearch).toLowerCase().trim();

  const filteredItems = items.filter((s) => {
    if (!effectiveSearch) return true;
    return (
      s.name.toLowerCase().includes(effectiveSearch) ||
      s.id.toLowerCase().includes(effectiveSearch) ||
      s.category.toLowerCase().includes(effectiveSearch) ||
      s.businessOwner?.toLowerCase().includes(effectiveSearch) ||
      s.description?.toLowerCase().includes(effectiveSearch)
    );
  });

  const operationalCount = items.filter((s) => s.healthStatus === 'Operational').length;
  const totalSupportingCis = items.reduce((acc, curr) => acc + (curr.supportingCisCount || 0), 0);
  const avgSla =
    items.length > 0
      ? (items.reduce((acc, curr) => acc + curr.uptimeSlaPercent, 0) / items.length).toFixed(2)
      : '99.9';

  return (
    <div className="space-y-6">
      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Operational Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Operational Status
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{operationalCount}</span>
              <span className="text-xs text-slate-500 font-medium">/ {items.length} online</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Average Uptime SLA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Average Uptime SLA
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{avgSla}%</span>
              <span className="text-xs text-emerald-600 font-bold">Target &gt;99.9%</span>
            </div>
          </div>
          <div className="p-3 bg-[#FFF9F5] text-[#C96F55] border border-[#ebdcd3] rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Supporting CIs Mapped */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Supporting CIs Mapped
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{totalSupportingCis}</span>
              <span className="text-xs text-slate-500 font-medium">active dependencies</span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Registered Business Services Table/Card List ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#C96F55]" />
            <h2 className="font-bold text-slate-800 text-sm">Registered Business Services</h2>
            <span className="text-xs text-slate-400 font-medium">
              ({filteredItems.length} {filteredItems.length === 1 ? 'service' : 'services'})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!searchFilter && (
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Filter services..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#C96F55] w-44"
                />
              </div>
            )}

            <RefreshButton
              onClick={loadData}
              isLoading={isLoading}
              title="Refresh Service Status"
            />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Server className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">No services match your search criteria.</p>
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="mt-2 text-xs text-[#C96F55] font-bold hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((service) => (
              <div
                key={service.id}
                className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FFF9F5]/40 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-[#C96F55]">{service.id}</span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{service.name}</h3>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200/60">
                      {service.category}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed max-w-3xl">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5 flex-wrap">
                    <span>
                      Owner: <strong className="text-slate-700">{service.businessOwner}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Recent Incident:{' '}
                      <strong className="text-slate-700">{service.lastIncidentDate || 'None'}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-5 shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      SLA Target
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {service.uptimeSlaPercent}%
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Dependencies
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      {service.supportingCisCount} CIs
                    </span>
                  </div>

                  <div className="min-w-[105px] flex justify-end">
                    <StatusBadge
                      status={service.healthStatus}
                      variant={getServiceHealthVariant(service.healthStatus)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCisView;
