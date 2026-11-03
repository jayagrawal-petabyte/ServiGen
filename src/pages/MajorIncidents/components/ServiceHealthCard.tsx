import React, { useState } from 'react';
import type { Priority } from '../types/majorIncident.types';

interface ServiceHealthCardProps {
  product: string;
  priority: Priority;
  isClosedOrResolved?: boolean;
  onNavigateCmdb?: () => void;
}

interface DependentCi {
  tag: string;
  name: string;
  type: string;
  status: 'Critical Outage' | 'Degraded' | 'Healthy';
  latency?: string;
}

/**
 * Returns dynamic dependent CIs and topology based on the product/CI name
 */
function getDependentTopology(productName: string, isHealthy: boolean): DependentCi[] {
  const p = (productName || '').toLowerCase();

  if (p.includes('payment') || p.includes('gateway')) {
    return [
      {
        tag: 'CI-GW-01',
        name: 'Stripe/Banking Ingress Proxy',
        type: 'Network Gateway',
        status: isHealthy ? 'Healthy' : 'Degraded',
        latency: isHealthy ? '32ms' : '1,840ms',
      },
      {
        tag: 'CI-DB-PAY',
        name: 'Transactional SQL Cluster (Primary)',
        type: 'Database',
        status: isHealthy ? 'Healthy' : 'Critical Outage',
        latency: isHealthy ? '4ms' : 'ERR_TIMEOUT',
      },
      {
        tag: 'CI-K8S-04',
        name: 'Payment Processing Microservices',
        type: 'Cloud Compute',
        status: isHealthy ? 'Healthy' : 'Critical Outage',
        latency: isHealthy ? '15ms' : 'Pod OOMKilled',
      },
    ];
  }

  if (p.includes('database') || p.includes('data') || p.includes('sql')) {
    return [
      {
        tag: 'CI-DB-PRI',
        name: 'Primary PostgreSQL Replicaset',
        type: 'Database',
        status: isHealthy ? 'Healthy' : 'Critical Outage',
        latency: isHealthy ? '2ms' : 'Lock Contention',
      },
      {
        tag: 'CI-CACHE-01',
        name: 'Distributed Redis State Store',
        type: 'Cache',
        status: isHealthy ? 'Healthy' : 'Degraded',
        latency: isHealthy ? '1ms' : 'Memory High',
      },
      {
        tag: 'CI-SAN-02',
        name: 'NVMe Storage Volume Array',
        type: 'Storage',
        status: 'Healthy',
        latency: '0.8ms',
      },
    ];
  }

  // Default topology for MyFinance PROD or generic services
  return [
    {
      tag: 'CI-APP-SRV',
      name: `${productName || 'Core Application'} Host`,
      type: 'Application',
      status: isHealthy ? 'Healthy' : 'Critical Outage',
      latency: isHealthy ? '45ms' : 'HTTP 504',
    },
    {
      tag: 'CI-AUTH-SSO',
      name: 'Corporate OAuth2 / SAML Identity Provider',
      type: 'Security / Auth',
      status: isHealthy ? 'Healthy' : 'Degraded',
      latency: isHealthy ? '18ms' : 'Token Wait',
    },
    {
      tag: 'CI-LB-EDGE',
      name: 'Edge Cloudflare CDN / WAF',
      type: 'Network',
      status: 'Healthy',
      latency: '12ms',
    },
  ];
}

export const ServiceHealthCard: React.FC<ServiceHealthCardProps> = ({
  product,
  priority,
  isClosedOrResolved = false,
  onNavigateCmdb,
}) => {
  const [showTopology, setShowTopology] = useState(false);

  // Derive health status and impact percentage
  let healthLabel = 'Operational';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';
  let ping = false;
  let affectedPercentage = '0.0%';
  let affectedUsers = '0 users affected';

  if (!isClosedOrResolved) {
    if (priority === 'Critical') {
      healthLabel = 'Major Outage';
      badgeColor = 'bg-red-50 text-red-700 border-red-200';
      dotColor = 'bg-red-500';
      ping = true;
      affectedPercentage = '99.1%';
      affectedUsers = '~1,450 users impacted';
    } else if (priority === 'High') {
      healthLabel = 'Partial Outage';
      badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
      dotColor = 'bg-orange-500';
      ping = true;
      affectedPercentage = '64.8%';
      affectedUsers = '~620 users impacted';
    } else if (priority === 'Medium') {
      healthLabel = 'Degraded Performance';
      badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      ping = false;
      affectedPercentage = '21.4%';
      affectedUsers = '~180 users impacted';
    } else {
      healthLabel = 'Minor Disruption';
      badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500';
      ping = false;
      affectedPercentage = '4.2%';
      affectedUsers = 'Local isolated issue';
    }
  }

  const topology = getDependentTopology(product, isClosedOrResolved);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs space-y-3">
      {/* Header Row: CI name & Live Halo-style Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Service Health Visibility (CMDB)
            </span>
          </div>
          <h4 className="text-xs font-bold text-gray-900 truncate flex items-center gap-1.5" title={product}>
            <span className="text-sm">🖥️</span>
            <span className="truncate">{product || 'Primary Service CI'}</span>
          </h4>
        </div>

        {/* Live Status Badge: e.g. "Payment Gateway: Major Outage (99.1% affected)" */}
        <div
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${badgeColor} shadow-2xs`}
        >
          <span className="relative flex h-2 w-2">
            {ping && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`} />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
          </span>
          <span>
            {healthLabel} {!isClosedOrResolved && `(${affectedPercentage} affected)`}
          </span>
        </div>
      </div>

      {/* Metrics Row: Blast Radius + SLA Target */}
      <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50/90 rounded-lg border border-gray-100 text-[11px]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Blast Radius</span>
          <span className="font-semibold text-gray-800">{affectedUsers}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Uptime SLA Target</span>
          <span className="font-semibold text-gray-800">99.9% (Breached)</span>
        </div>
      </div>

      {/* Dependent Infrastructure Accordion Toggle */}
      <div className="pt-1 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowTopology((prev) => !prev)}
            className="text-[11px] font-bold text-[#eb6a47] hover:text-[#d35432] flex items-center gap-1 cursor-pointer border-none bg-transparent p-0"
          >
            <span>{showTopology ? '▾ Hide' : '▸ View'} Dependent Infrastructure ({topology.length} CIs)</span>
          </button>
          {onNavigateCmdb && (
            <button
              type="button"
              onClick={onNavigateCmdb}
              className="text-[10px] text-cyan-600 hover:text-cyan-800 font-bold cursor-pointer border-none bg-transparent p-0"
            >
              Open CMDB Topology →
            </button>
          )}
        </div>

        {/* Dependent Topology List */}
        {showTopology && (
          <div className="mt-2.5 space-y-1.5">
            {topology.map((ci) => {
              let ciBadge = 'bg-gray-100 text-gray-700';
              if (ci.status === 'Critical Outage') ciBadge = 'bg-red-100 text-red-700';
              if (ci.status === 'Degraded') ciBadge = 'bg-amber-100 text-amber-700';
              if (ci.status === 'Healthy') ciBadge = 'bg-emerald-100 text-emerald-700';

              return (
                <div
                  key={ci.tag}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-[11px]"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-gray-400">{ci.tag}</span>
                      <span className="font-bold text-gray-800 truncate">{ci.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">{ci.type}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${ciBadge}`}>
                      {ci.status}
                    </span>
                    {ci.latency && (
                      <span className="block text-[9px] text-gray-400 font-mono mt-0.5">{ci.latency}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceHealthCard;
