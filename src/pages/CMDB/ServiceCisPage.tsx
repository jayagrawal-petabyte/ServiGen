import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ServiceCI } from '../../types/cmdb';
import { fetchServiceCis } from '../../services/cmdbService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getServiceHealthVariant } from '../../utils/statusUtils';
import {
  ShieldCheck,
  AlertCircle,
  Server,
  CheckCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';

interface ServiceCisPageProps {
  serviceCis?: ServiceCI[];
}

export const ServiceCisPage: React.FC<ServiceCisPageProps> = ({ serviceCis: initialServices }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ServiceCI[]>(initialServices || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialServices);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchServiceCis();
      setItems(res.data);
    } catch (err: any) {
      console.error('[ServiceCisPage] Error fetching service CIs:', err);
      setError(err?.message || 'Failed to load Service CIs.');
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

  // Derived metrics from loaded data
  const operationalCount = items.filter((s) => s.healthStatus === 'Operational').length;
  const totalSupportingCis = items.reduce((acc, curr) => acc + (curr.supportingCisCount || 0), 0);
  const avgSla = items.length > 0
    ? (items.reduce((acc, curr) => acc + curr.uptimeSlaPercent, 0) / items.length).toFixed(2)
    : '99.9';

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#F8F9FD] select-none">
      {/* Header with Navigation Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Service CIs — Live Service Health
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            CMDB: Service CIs (Live) — Real-time service health & SLA monitoring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Main Module Tabs (Configuration Items vs Live Service Health) */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-2xl gap-1">
            <button
              onClick={() => navigate('/cmdb')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white/60 cursor-pointer transition-all"
            >
              Configuration Items (CIs)
            </button>
            <button
              onClick={() => navigate('/cmdb/services')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E87A5D] text-white shadow-2xs cursor-pointer transition-all"
            >
              Service CIs (Live Health)
            </button>
          </div>

          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#E87A5D]' : ''}`} />
            Refresh Live Health
          </button>

          <GlobalNavbarActions />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Operational Services</span>
            <h3 className="text-2xl font-extrabold text-slate-900">
              {operationalCount} / {items.length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Average SLA</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{avgSla}%</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Supporting CIs</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{totalSupportingCis}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Monitored Endpoints</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{items.length}</h3>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((service: ServiceCI) => (
          <div
            key={service.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all duration-200"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {service.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base leading-snug mt-0.5">
                    {service.name}
                  </h3>
                </div>
                <StatusBadge
                  label={service.healthStatus}
                  variant={getServiceHealthVariant(service.healthStatus)}
                />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {service.description}
              </p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1 text-slate-700 font-bold">
                    <span>Uptime SLA</span>
                    <span className="text-slate-900">{service.uptimeSlaPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        service.uptimeSlaPercent >= 99.9
                          ? 'bg-emerald-500'
                          : service.uptimeSlaPercent >= 99.0
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, service.uptimeSlaPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
                  <span className="font-medium">Business Owner</span>
                  <span className="font-bold text-slate-800">{service.businessOwner}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Supporting CIs</span>
                  <span className="font-bold text-indigo-600">{service.supportingCisCount} mapped</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Last Incident: {service.lastIncidentDate || 'None'}</span>
              <button
                type="button"
                onClick={() => navigate('/services-catalogue')}
                className="flex items-center gap-1 text-[#E87A5D] font-bold hover:underline cursor-pointer"
              >
                Catalogue <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && !isLoading && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <Server className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
            <p className="text-sm font-bold text-slate-600">No Service CIs Loaded</p>
            <p className="text-xs text-slate-400 mt-1">
              Click refresh above to query the live CMDB services endpoint
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
