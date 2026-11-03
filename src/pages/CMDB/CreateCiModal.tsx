import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ConfigurationItem, CiType, CiStatus, CiLifecycleState } from '../../types/cmdb';
import { X, Plus, AlertCircle, Loader2, Server } from 'lucide-react';

interface CreateCiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newCi: ConfigurationItem) => void;
}

export const CreateCiModal: React.FC<CreateCiModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [type, setType] = useState<CiType>('Server');
  const [site, setSite] = useState('London Primary DC (Lon-01)');
  const [environment, setEnvironment] = useState('Production');
  const [businessOwner, setBusinessOwner] = useState('Technology');
  const [technicalContact, setTechnicalContact] = useState('Platform Operations');
  const [ipAddress, setIpAddress] = useState('');
  const [lifecycleState, setLifecycleState] = useState<CiLifecycleState>('Deployed');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('CI Name is required.');
      return;
    }
    const generatedTag = tag.trim() || `${type.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

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
      ipAddress: ipAddress.trim() || undefined,
      activeIncidentsCount: 0,
      linkedChangesCount: 0,
      lastUpdated: 'Just now',
      criticality: 'Tier 2 - Business Operational',
      specifications: {
        ipAddress: ipAddress.trim() || undefined,
        os: 'Ubuntu Linux 22.04 LTS',
        cpu: '8 vCPU',
        ram: '32 GB',
      },
      relationships: [],
    };

    onCreate(newCi);
    onClose();
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
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-[#eb6a47]" />
            <h2 className="text-xl font-bold text-slate-900">Register Configuration Item (CI)</h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Configuration Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Redis Session Cache Cluster Node 01"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#eb6a47] focus:bg-white transition-all text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Asset Tag</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. DB-003 (or auto-assigned)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">CI Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CiType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              >
                <option value="Server">Server</option>
                <option value="Database">Database</option>
                <option value="Network">Network Device</option>
                <option value="Cloud Service">Cloud Service</option>
                <option value="Security">Security Asset</option>
                <option value="Application">Application</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Site Location</label>
              <input
                type="text"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Development">Development</option>
                <option value="Disaster Recovery">Disaster Recovery</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Business Owner</label>
              <input
                type="text"
                value={businessOwner}
                onChange={(e) => setBusinessOwner(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Technical Contact</label>
              <input
                type="text"
                value={technicalContact}
                onChange={(e) => setTechnicalContact(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">IP Address</label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="10.240.12.50"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Lifecycle State</label>
              <select
                value={lifecycleState}
                onChange={(e) => setLifecycleState(e.target.value as CiLifecycleState)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              >
                <option value="Deployed">Deployed (Live)</option>
                <option value="In Stock">In Stock (Staged)</option>
                <option value="Ordered">Ordered (Procurement)</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#eb6a47] hover:bg-[#db5936] text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register CI</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
