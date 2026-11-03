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
  Layers,
  Activity,
  Plus,
} from 'lucide-react';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';

export const DEFAULT_SERVICE_CIS: ServiceCI[] = [
  {
    id: 'SVC-001',
    name: 'Core Payment Gateway Service',
    category: 'Finance & Transactional',
    healthStatus: 'Operational',
    uptimeSlaPercent: 99.98,
    businessOwner: 'Finance & Payments',
    supportingCisCount: 4,
    description: 'Payment authorization and processing cluster backed by PAY-001 and DB-001.',
    lastIncidentDate: 'None in last 30 days',
  },
  {
    id: 'SVC-002',
    name: 'Customer Authentication & SSO Service',
    category: 'Security & Identity',
    healthStatus: 'Operational',
    uptimeSlaPercent: 99.99,
    businessOwner: 'InfoSec & Identity',
    supportingCisCount: 3,
    description: 'Workforce and customer identity access federated via Okta IdP (SEC-001).',
    lastIncidentDate: 'None in last 45 days',
  },
  {
    id: 'SVC-003',
    name: 'Customer Portal Web Platform',
    category: 'Digital Channels',
    healthStatus: 'Operational',
    uptimeSlaPercent: 99.94,
    businessOwner: 'Customer Experience',
    supportingCisCount: 3,
    description: 'Customer facing web portal hosted on APP-001 behind Cloudflare CDN (CDN-001).',
    lastIncidentDate: 'Resolved 3 days ago',
  },
  {
    id: 'SVC-004',
    name: 'Corporate Network & VPN Routing Service',
    category: 'Network Infrastructure',
    healthStatus: 'Operational',
    uptimeSlaPercent: 100.0,
    businessOwner: 'Network Operations',
    supportingCisCount: 5,
    description: 'Global corporate routing, SD-WAN, and VPN endpoints managed via NET-001.',
    lastIncidentDate: 'None in last 60 days',
  },
  {
    id: 'SVC-005',
    name: 'Real-Time Event Streaming & Notifications',
    category: 'Data Platform',
    healthStatus: 'Degraded',
    uptimeSlaPercent: 98.45,
    businessOwner: 'Platform Engineering',
    supportingCisCount: 2,
    description: 'Kafka and webhooks delivery queue currently experiencing elevated latency.',
    lastIncidentDate: 'Active incident reported',
  },
  {
    id: 'SVC-006',
    name: 'Disaster Recovery & Immutable Backup Store',
    category: 'Business Continuity',
    healthStatus: 'Operational',
    uptimeSlaPercent: 99.95,
    businessOwner: 'Infrastructure & Storage',
    supportingCisCount: 2,
    description: 'Daily automated block-level backup sync to Frankfurt DR SAN (SAN-001).',
    lastIncidentDate: 'Scheduled routine verification',
  },
];

interface ServiceCisPageProps {
  serviceCis?: ServiceCI[];
}

export const ServiceCisPage: React.FC<ServiceCisPageProps> = ({ serviceCis: initialServices }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ServiceCI[]>(
    initialServices && initialServices.length > 0 ? initialServices : DEFAULT_SERVICE_CIS
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
        setItems(DEFAULT_SERVICE_CIS);
      }
    } catch (err: any) {
      console.warn('[ServiceCisPage] Error fetching service CIs, using defaults:', err);
      setItems(DEFAULT_SERVICE_CIS);
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
    <div className="flex-1 w-full min-h-screen flex flex-col bg-[#faf6f2] select-none">
      {/* ── Top Navbar ── */}
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
          <span className="text-gray-900">Live Service Health</span>
        </div>
        <GlobalNavbarActions />
      </header>

      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* Header with Navigation Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Service CIs — Live Service Health
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              CMDB: Real-time service topology health, uptime SLA monitoring, and supporting infrastructure
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Main Module Tabs (Configuration Items vs Live Service Health) */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => navigate('/cmdb')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white/60 cursor-pointer transition-all"
              >
                Configuration Items (CIs)
              </button>
              <button
                type="button"
                onClick={() => navigate('/cmdb/services')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#eb6a47] text-white shadow-2xs cursor-pointer transition-all"
              >
                Service CIs (Live Health)
              </button>
            </div>

            <button
              type="button"
              onClick={() => loadData()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#eb6a47]' : ''}`} />
              Refresh Live Health
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              type="button"
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
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Telemetry Health</span>
              <h3 className="text-2xl font-extrabold text-slate-900">
                {operationalCount === items.length ? 'Healthy' : `${items.length - operationalCount} Degraded`}
              </h3>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((svc: ServiceCI) => (
            <div
              key={svc.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <Layers className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-[#eb6a47] uppercase tracking-wide block">
                        {svc.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight mt-0.5">
                        {svc.name}
                      </h3>
                    </div>
                  </div>
                  <StatusBadge label={svc.healthStatus} variant={getServiceHealthVariant(svc.healthStatus)} />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {svc.description}
                </p>

                <div className="grid grid-cols-2 gap-2 my-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Uptime SLA</span>
                    <span className="font-extrabold text-slate-900 text-sm">{svc.uptimeSlaPercent}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Supporting CIs</span>
                    <span className="font-bold text-indigo-700 text-sm">{svc.supportingCisCount} CIs</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/60 text-[10px] text-slate-500 flex justify-between">
                    <span>Owner: {svc.businessOwner}</span>
                    <span>{svc.lastIncidentDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => navigate(`/cmdb?search=${encodeURIComponent(svc.name.split(' ')[0])}`)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <span>View Supporting CIs</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/change-requests?openCreate=true&category=${encodeURIComponent(svc.name)}`)}
                  className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold rounded-lg border border-cyan-200 cursor-pointer transition-colors"
                >
                  Schedule Maintenance
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceCisPage;
