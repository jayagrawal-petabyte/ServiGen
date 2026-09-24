import React from 'react';
import type { ServiceCI } from '../../types/cmdb';
import { mockServiceCis } from '../../data/mockCmdbData';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getServiceHealthVariant } from '../../utils/statusUtils';
import { Activity, ShieldCheck, AlertCircle, Server, CheckCircle } from 'lucide-react';

interface ServiceCisPageProps {
  serviceCis?: ServiceCI[];
}

export const ServiceCisPage: React.FC<ServiceCisPageProps> = ({ serviceCis = mockServiceCis }) => {
  const items = serviceCis.length > 0 ? serviceCis : mockServiceCis;

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#F8F9FD] select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Service CIs — Live Service Health
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            CMDB: Service CIs (Live) — Real-time service health & SLA monitoring
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Operational Services</span>
            <h3 className="text-2xl font-extrabold text-slate-900">3 / 4</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Platform SLA</span>
            <h3 className="text-2xl font-extrabold text-slate-900">99.98%</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Supporting CIs</span>
            <h3 className="text-2xl font-extrabold text-slate-900">32</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Active Maintenance</span>
            <h3 className="text-2xl font-extrabold text-amber-600">1</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((svc) => (
          <div
            key={svc.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-[#E87A5D]">{svc.id}</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
                      {svc.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{svc.name}</h3>
                </div>
                <StatusBadge label={svc.healthStatus} variant={getServiceHealthVariant(svc.healthStatus)} />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-5">{svc.description}</p>

              <div className="mb-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#E87A5D]" /> Uptime SLA
                  </span>
                  <span className="font-bold text-emerald-600">{svc.uptimeSlaPercent}% Target</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${svc.uptimeSlaPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                Owner: <strong className="text-slate-900">{svc.businessOwner}</strong>
              </span>
              <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg font-bold">
                {svc.supportingCisCount} Supporting CIs
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
