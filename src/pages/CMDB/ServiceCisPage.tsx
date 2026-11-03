import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ServiceCI } from '../../types/cmdb';
import { fetchServiceCis } from '../../services/cmdbService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getServiceHealthVariant } from '../../utils/statusUtils';
import { defaultServiceCis } from './cmdbData';
import {
  ShieldCheck,
  AlertCircle,
  Server,
  CheckCircle,
  RefreshCw,
  Layers,
  Activity,
  Plus,
} from 'lucide-react';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';

interface ServiceCisPageProps {
  serviceCis?: ServiceCI[];
}

export const ServiceCisPage: React.FC<ServiceCisPageProps> = ({ serviceCis: initialServices }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ServiceCI[]>(
    initialServices && initialServices.length > 0 ? initialServices : defaultServiceCis
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!initialServices) {
      loadData();
    } else {
      setItems(initialServices);
    }
  }, [initialServices, loadData]);

  const operationalCount = items.filter((s) => s.healthStatus === 'Operational').length;
  const totalSupportingCis = items.reduce((acc, curr) => acc + (curr.supportingCisCount || 0), 0);
  const avgSla = items.length > 0
    ? (items.reduce((acc, curr) => acc + curr.uptimeSlaPercent, 0) / items.length).toFixed(2)
    : '99.9';

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-[#faf6f2] select-none">
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="hover:text-slate-800 bg-transparent border-none cursor-pointer p-0"
          >
            Service Desk
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate('/cmdb')}
            className="hover:text-slate-800 bg-transparent border-none cursor-pointer p-0"
          >
            CMDB
          </button>
          <span>/</span>
          <span className="text-[#eb6a47] font-extrabold">Service CIs & SLA</span>
        </div>
        <GlobalNavbarActions />
      </header>

      <div className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Service Configuration Items
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Business service mapping, live health telemetry, and SLA reliability targets.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/cmdb')}
              className="px-4 py-2 bg-white text-slate-700 font-bold text-xs rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Server className="w-4 h-4 text-[#eb6a47]" />
              <span>Asset Inventory</span>
            </button>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              title="Refresh Service Status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </div>

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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm">Registered Business Services</h2>
            <span className="text-xs text-slate-400 font-medium">{items.length} items</span>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map((service) => (
              <div
                key={service.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-400">{service.id}</span>
                    <h3 className="font-bold text-slate-900 text-base">{service.name}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                      {service.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>Owner: <strong className="text-slate-700">{service.businessOwner}</strong></span>
                    <span>•</span>
                    <span>Recent Incident: <strong className="text-slate-700">{service.lastIncidentDate || 'None'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 self-end md:self-center">
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

                  <div className="min-w-[110px] flex justify-end">
                    <StatusBadge
                      label={service.healthStatus}
                      variant={getServiceHealthVariant(service.healthStatus)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
