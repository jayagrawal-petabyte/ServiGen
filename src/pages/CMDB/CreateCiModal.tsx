import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ConfigurationItem, CiType, CiStatus, CiLifecycleState } from '../../types/cmdb';
import {
  X,
  Plus,
  AlertCircle,
  Loader2,
  Server,
  Database,
  Network,
  Cloud,
  Shield,
  Layers,
  Cpu,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface CreateCiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newCi: ConfigurationItem) => Promise<void> | void;
}

export const CreateCiModal: React.FC<CreateCiModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  // General CI Details
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [type, setType] = useState<CiType>('Server');
  const [site, setSite] = useState('London Primary DC (Lon-01)');
  const [environment, setEnvironment] = useState('Production');
  const [businessOwner, setBusinessOwner] = useState('Technology');
  const [technicalContact, setTechnicalContact] = useState('Platform Operations');
  const [lifecycleState, setLifecycleState] = useState<CiLifecycleState>('Deployed');
  const [criticality, setCriticality] = useState<'Tier 1 - Mission Critical' | 'Tier 2 - Business Operational' | 'Tier 3 - Supporting'>('Tier 2 - Business Operational');
  const [warrantyExpiry, setWarrantyExpiry] = useState<string>('2028-12-31');

  // Server Specific Fields
  const [serverOs, setServerOs] = useState('Ubuntu Linux 22.04 LTS');
  const [serverCpu, setServerCpu] = useState('16 vCPU');
  const [serverRam, setServerRam] = useState('64 GB ECC');
  const [serverStorage, setServerStorage] = useState('2 TB NVMe RAID 10');
  const [serverModel, setServerModel] = useState('Dell PowerEdge R750 2U');
  const [serverIp, setServerIp] = useState('10.240.14.88');
  const [serverMac, setServerMac] = useState('00:1A:2B:3C:4D:5E');
  const [serverRack, setServerRack] = useState('Rack B-14, U18-U20');

  // Application / Software Specific Fields
  const [appVersion, setAppVersion] = useState('v2.4.1');
  const [appRuntime, setAppRuntime] = useState('Node.js 20 LTS');
  const [appPort, setAppPort] = useState('443 / HTTPS');
  const [appHostServer, setAppHostServer] = useState('PAY-001 (Server)');
  const [appUrl, setAppUrl] = useState('https://portal.servigen.com/health');
  const [appLicenseKey, setAppLicenseKey] = useState('LIC-ENT-2026-X94B');
  const [appLicenseExpiry, setAppLicenseExpiry] = useState('2027-12-31');

  // Network Specific Fields
  const [netCategory, setNetCategory] = useState('Core Router');
  const [netFirmware, setNetFirmware] = useState('Cisco IOS XR 7.5.2');
  const [netPorts, setNetPorts] = useState('48x 10GbE SFP+ + 4x 100GbE');
  const [netIp, setNetIp] = useState('10.240.0.1');
  const [netMac, setNetMac] = useState('00:00:0C:9F:F0:01');
  const [netProtocol, setNetProtocol] = useState('SSHv2 / SNMPv3');
  const [netVlan, setNetVlan] = useState('VLAN 100 (Core Infrastructure)');
  const [netRack, setNetRack] = useState('Rack A-01, U40-U42');

  // Database Specific Fields
  const [dbEngine, setDbEngine] = useState('PostgreSQL');
  const [dbVersion, setDbVersion] = useState('16.2');
  const [dbPort, setDbPort] = useState('5432');
  const [dbRole, setDbRole] = useState('Primary High-Availability Cluster');
  const [dbStorage, setDbStorage] = useState('1.5 TB NVMe');

  // Cloud Service Specific Fields
  const [cloudProvider, setCloudProvider] = useState('AWS');
  const [cloudRegion, setCloudRegion] = useState('eu-west-1 (Ireland)');
  const [cloudServiceOffering, setCloudServiceOffering] = useState('Kubernetes EKS Cluster');
  const [cloudPool, setCloudPool] = useState('m6i.4xlarge (4 instances)');
  const [cloudCidr, setCloudCidr] = useState('52.214.0.0/16');

  // Security Specific Fields
  const [secCategory, setSecCategory] = useState('Web Application Firewall (WAF)');
  const [secVendor, setSecVendor] = useState('Cloudflare Enterprise / F5');
  const [secIp, setSecIp] = useState('198.51.100.4');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('CI Name is required.');
      return;
    }

    const prefixMap: Record<CiType, string> = {
      Server: 'SRV',
      Application: 'APP',
      Network: 'NET',
      Database: 'DB',
      'Cloud Service': 'AWS',
      Security: 'SEC',
    };

    const prefix = prefixMap[type] || 'CI';
    const generatedTag =
      tag.trim() || `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    // Build type-specific specifications dictionary
    let specifications: Record<string, any> = {};
    let resolvedIp: string | undefined = undefined;

    if (type === 'Server') {
      specifications = {
        os: serverOs,
        cpu: serverCpu,
        ram: serverRam,
        storage: serverStorage,
        model: serverModel,
        ipAddress: serverIp.trim() || undefined,
        macAddress: serverMac,
        rackLocation: serverRack,
        warrantyExpiry: warrantyExpiry || undefined,
      };
      resolvedIp = serverIp.trim() || undefined;
    } else if (type === 'Application') {
      specifications = {
        version: appVersion,
        runtime: appRuntime,
        port: appPort,
        hostServer: appHostServer,
        healthUrl: appUrl,
        licenseKey: appLicenseKey,
        licenseExpiry: appLicenseExpiry,
        warrantyExpiry: appLicenseExpiry || warrantyExpiry,
      };
      resolvedIp = undefined;
    } else if (type === 'Network') {
      specifications = {
        deviceCategory: netCategory,
        os: netFirmware,
        firmwareVersion: netFirmware,
        ports: netPorts,
        ipAddress: netIp.trim() || undefined,
        macAddress: netMac,
        protocol: netProtocol,
        vlan: netVlan,
        rackLocation: netRack,
        warrantyExpiry: warrantyExpiry || undefined,
      };
      resolvedIp = netIp.trim() || undefined;
    } else if (type === 'Database') {
      specifications = {
        engine: dbEngine,
        version: dbVersion,
        port: dbPort,
        role: dbRole,
        storage: dbStorage,
        warrantyExpiry: warrantyExpiry || undefined,
      };
      resolvedIp = undefined;
    } else if (type === 'Cloud Service') {
      specifications = {
        cloudProvider,
        region: cloudRegion,
        serviceOffering: cloudServiceOffering,
        instancePool: cloudPool,
        ipAddress: cloudCidr,
        warrantyExpiry: warrantyExpiry || undefined,
      };
      resolvedIp = cloudCidr;
    } else if (type === 'Security') {
      specifications = {
        securityCategory: secCategory,
        vendor: secVendor,
        ipAddress: secIp,
        warrantyExpiry: warrantyExpiry || undefined,
      };
      resolvedIp = secIp;
    }

    const softwareLicenses =
      type === 'Application' && appLicenseKey
        ? [
            {
              name: `${name.trim()} Commercial License`,
              licenseKeyMasked: `${appLicenseKey.slice(0, 4)}-****-${appLicenseKey.slice(-4)}`,
              expiryDate: appLicenseExpiry || 'Dec 31, 2027',
              seatsTotal: 100,
              seatsAllocated: 15,
            },
          ]
        : [];

    const newCi: ConfigurationItem = {
      id: `CI-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      tag: generatedTag,
      type,
      site,
      environment,
      status: 'Active',
      lifecycleState,
      businessOwner: businessOwner.trim() || 'Technology',
      technicalContact: technicalContact.trim() || 'Platform Operations',
      ipAddress: resolvedIp,
      activeIncidentsCount: 0,
      linkedChangesCount: 0,
      lastUpdated: 'Just now',
      criticality,
      warrantyExpiry: warrantyExpiry || undefined,
      specifications,
      softwareLicenses,
      relationships: [],
    };

    setIsSubmitting(true);
    setValidationError(null);
    try {
      await onCreate(newCi);
      setName('');
      setTag('');
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setValidationError(err?.message || 'Failed to register configuration item in CMDB.');
    }
  };

  const typeOptions: Array<{ type: CiType; label: string; icon: React.ReactNode }> = [
    { type: 'Server', label: 'Server', icon: <Server className="w-4 h-4" /> },
    { type: 'Application', label: 'Software / App', icon: <Layers className="w-4 h-4" /> },
    { type: 'Network', label: 'Network Device', icon: <Network className="w-4 h-4" /> },
    { type: 'Database', label: 'Database', icon: <Database className="w-4 h-4" /> },
    { type: 'Cloud Service', label: 'Cloud Service', icon: <Cloud className="w-4 h-4" /> },
    { type: 'Security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col my-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-t-3xl sticky top-0 z-20 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#eb6a47]/10 text-[#eb6a47] rounded-xl border border-[#eb6a47]/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Register Configuration Item (CI)</h2>
              <p className="text-xs text-slate-500">
                Form dynamically adapts specifications according to selected CI category
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-700">
          {/* 1. CI Type Selection Pills */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
              1. Select CI Category (Controls Dynamic Fields) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {typeOptions.map((opt) => {
                const isSelected = type === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setType(opt.type)}
                    className={`px-3 py-2.5 rounded-xl border font-bold flex items-center gap-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#eb6a47] text-white border-[#eb6a47] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : 'text-[#eb6a47]'}>
                      {opt.icon}
                    </span>
                    <span className="truncate text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Common Identification Fields */}
          <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 space-y-3.5">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              2. Core Identification & Ownership
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">
                  Configuration Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    type === 'Server'
                      ? 'e.g. Primary Application Server 01'
                      : type === 'Application'
                      ? 'e.g. Payment Gateway Web Service'
                      : type === 'Network'
                      ? 'e.g. Core Backbone Switch Lon-01'
                      : 'e.g. Production Database Cluster'
                  }
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Asset Tag</label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Auto-generated"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Datacenter / Site</label>
                <input
                  type="text"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                  <option value="Disaster Recovery">Disaster Recovery</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Lifecycle State</label>
                <select
                  value={lifecycleState}
                  onChange={(e) => setLifecycleState(e.target.value as CiLifecycleState)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                >
                  <option value="Deployed">Deployed (Active)</option>
                  <option value="In Stock">In Stock (Staged)</option>
                  <option value="Ordered">Ordered (Procurement)</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Business Owner</label>
                <input
                  type="text"
                  value={businessOwner}
                  onChange={(e) => setBusinessOwner(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Technical Contact</label>
                <input
                  type="text"
                  value={technicalContact}
                  onChange={(e) => setTechnicalContact(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Criticality</label>
                <select
                  value={criticality}
                  onChange={(e) => setCriticality(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                >
                  <option value="Tier 1 - Mission Critical">Tier 1 - Mission Critical</option>
                  <option value="Tier 2 - Business Operational">Tier 2 - Business Operational</option>
                  <option value="Tier 3 - Supporting">Tier 3 - Supporting</option>
                </select>
              </div>
            </div>

            {/* Universal Warranty Expiry Date */}
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Warranty / Support Expiry Date</span>
              </label>
              <input
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
                className="w-full sm:w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>
          </div>

          {/* 3. DYNAMIC TYPE-SPECIFIC SPECIFICATIONS */}
          <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-200/60 space-y-3.5">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#eb6a47]" />
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                3. Dynamic Specifications ({type})
              </span>
            </div>

            {/* A. SERVER FIELDS */}
            {type === 'Server' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Operating System (OS)</label>
                    <input
                      type="text"
                      value={serverOs}
                      onChange={(e) => setServerOs(e.target.value)}
                      placeholder="e.g. Ubuntu Linux 22.04 LTS"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Hardware Model / Chassis</label>
                    <input
                      type="text"
                      value={serverModel}
                      onChange={(e) => setServerModel(e.target.value)}
                      placeholder="e.g. Dell PowerEdge R750 2U"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">CPU / vCPU</label>
                    <input
                      type="text"
                      value={serverCpu}
                      onChange={(e) => setServerCpu(e.target.value)}
                      placeholder="e.g. 16 vCPU (2x Xeon)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">RAM Memory</label>
                    <input
                      type="text"
                      value={serverRam}
                      onChange={(e) => setServerRam(e.target.value)}
                      placeholder="e.g. 64 GB DDR4 ECC"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Storage Array</label>
                    <input
                      type="text"
                      value={serverStorage}
                      onChange={(e) => setServerStorage(e.target.value)}
                      placeholder="e.g. 2 TB NVMe RAID 10"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Primary IP Address</label>
                    <input
                      type="text"
                      value={serverIp}
                      onChange={(e) => setServerIp(e.target.value)}
                      placeholder="10.240.14.88"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">MAC Address</label>
                    <input
                      type="text"
                      value={serverMac}
                      onChange={(e) => setServerMac(e.target.value)}
                      placeholder="00:1A:2B:3C:4D:5E"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Datacenter Rack Slot</label>
                    <input
                      type="text"
                      value={serverRack}
                      onChange={(e) => setServerRack(e.target.value)}
                      placeholder="Rack B-14, U18-U20"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* B. APPLICATION (SOFTWARE) FIELDS */}
            {type === 'Application' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Release Version</label>
                    <input
                      type="text"
                      value={appVersion}
                      onChange={(e) => setAppVersion(e.target.value)}
                      placeholder="e.g. v2.4.1 (Stable)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Runtime / Stack</label>
                    <input
                      type="text"
                      value={appRuntime}
                      onChange={(e) => setAppRuntime(e.target.value)}
                      placeholder="e.g. Node.js 20 LTS / Java 17"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Port & Protocol</label>
                    <input
                      type="text"
                      value={appPort}
                      onChange={(e) => setAppPort(e.target.value)}
                      placeholder="e.g. 443 / HTTPS, 8080"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Host Server (Runs On)</label>
                    <input
                      type="text"
                      value={appHostServer}
                      onChange={(e) => setAppHostServer(e.target.value)}
                      placeholder="e.g. PAY-001 (Server)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Health / Probe Endpoint</label>
                    <input
                      type="text"
                      value={appUrl}
                      onChange={(e) => setAppUrl(e.target.value)}
                      placeholder="https://app.servigen.com/health"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-orange-200/60">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Software License Key</label>
                    <input
                      type="text"
                      value={appLicenseKey}
                      onChange={(e) => setAppLicenseKey(e.target.value)}
                      placeholder="e.g. LIC-ENT-2026-X94B"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">License Expiry Date</label>
                    <input
                      type="date"
                      value={appLicenseExpiry}
                      onChange={(e) => setAppLicenseExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* C. NETWORK FIELDS */}
            {type === 'Network' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Device Category</label>
                    <select
                      value={netCategory}
                      onChange={(e) => setNetCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    >
                      <option value="Core Router">Core Router</option>
                      <option value="Distribution Switch">Distribution Switch</option>
                      <option value="Access Switch">Access Switch</option>
                      <option value="Next-Gen Firewall">Next-Gen Firewall</option>
                      <option value="Load Balancer">Hardware Load Balancer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Firmware / OS</label>
                    <input
                      type="text"
                      value={netFirmware}
                      onChange={(e) => setNetFirmware(e.target.value)}
                      placeholder="e.g. Cisco IOS XR 7.5.2"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Port Specifications</label>
                    <input
                      type="text"
                      value={netPorts}
                      onChange={(e) => setNetPorts(e.target.value)}
                      placeholder="48x 10GbE + 4x 100GbE"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Management IP</label>
                    <input
                      type="text"
                      value={netIp}
                      onChange={(e) => setNetIp(e.target.value)}
                      placeholder="10.240.0.1"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">VLAN / Subnet</label>
                    <input
                      type="text"
                      value={netVlan}
                      onChange={(e) => setNetVlan(e.target.value)}
                      placeholder="VLAN 100 (Core Infra)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Datacenter Rack Slot</label>
                    <input
                      type="text"
                      value={netRack}
                      onChange={(e) => setNetRack(e.target.value)}
                      placeholder="Rack A-01, U40-U42"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* D. DATABASE FIELDS */}
            {type === 'Database' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Database Engine</label>
                    <select
                      value={dbEngine}
                      onChange={(e) => setDbEngine(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    >
                      <option value="PostgreSQL">PostgreSQL</option>
                      <option value="MySQL">MySQL Enterprise</option>
                      <option value="Oracle DB">Oracle Database</option>
                      <option value="MongoDB">MongoDB Atlas</option>
                      <option value="Redis">Redis In-Memory</option>
                      <option value="Microsoft SQL Server">MS SQL Server</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Engine Version</label>
                    <input
                      type="text"
                      value={dbVersion}
                      onChange={(e) => setDbVersion(e.target.value)}
                      placeholder="e.g. 16.2"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Port</label>
                    <input
                      type="text"
                      value={dbPort}
                      onChange={(e) => setDbPort(e.target.value)}
                      placeholder="e.g. 5432"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Cluster / HA Role</label>
                    <input
                      type="text"
                      value={dbRole}
                      onChange={(e) => setDbRole(e.target.value)}
                      placeholder="e.g. Primary High-Availability Cluster"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Allocated Storage Size</label>
                    <input
                      type="text"
                      value={dbStorage}
                      onChange={(e) => setDbStorage(e.target.value)}
                      placeholder="e.g. 1.5 TB NVMe"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* E. CLOUD SERVICE FIELDS */}
            {type === 'Cloud Service' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Cloud Provider</label>
                    <select
                      value={cloudProvider}
                      onChange={(e) => setCloudProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    >
                      <option value="AWS">Amazon Web Services (AWS)</option>
                      <option value="Azure">Microsoft Azure</option>
                      <option value="GCP">Google Cloud Platform (GCP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Region</label>
                    <input
                      type="text"
                      value={cloudRegion}
                      onChange={(e) => setCloudRegion(e.target.value)}
                      placeholder="e.g. eu-west-1 (Ireland)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Service Offering</label>
                    <input
                      type="text"
                      value={cloudServiceOffering}
                      onChange={(e) => setCloudServiceOffering(e.target.value)}
                      placeholder="e.g. Kubernetes EKS"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Instance Pool / Worker Specs</label>
                    <input
                      type="text"
                      value={cloudPool}
                      onChange={(e) => setCloudPool(e.target.value)}
                      placeholder="e.g. m6i.4xlarge (4 instances)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">VPC / Subnet CIDR Block</label>
                    <input
                      type="text"
                      value={cloudCidr}
                      onChange={(e) => setCloudCidr(e.target.value)}
                      placeholder="e.g. 52.214.0.0/16"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* F. SECURITY FIELDS */}
            {type === 'Security' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Security Category</label>
                    <input
                      type="text"
                      value={secCategory}
                      onChange={(e) => setSecCategory(e.target.value)}
                      placeholder="e.g. Web Application Firewall (WAF)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Vendor / Platform</label>
                    <input
                      type="text"
                      value={secVendor}
                      onChange={(e) => setSecVendor(e.target.value)}
                      placeholder="e.g. Cloudflare / Palo Alto"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Edge IP Address</label>
                    <input
                      type="text"
                      value={secIp}
                      onChange={(e) => setSecIp(e.target.value)}
                      placeholder="198.51.100.4"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#eb6a47] hover:bg-[#db5936] text-white font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering CI in Backend...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Register Configuration Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
