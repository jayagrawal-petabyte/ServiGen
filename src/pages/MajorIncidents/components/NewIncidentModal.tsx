import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { MajorIncident, Priority } from '../types/majorIncident.types';
import { api } from '../../../services/apiClient';
import Combobox from '../../../components/shared/Combobox';

interface NewIncidentModalProps {
  onClose: () => void;
  onSubmit: (incident: MajorIncident) => void;
}

const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

const PRIORITY_COLORS: Record<Priority, string> = {
  Critical: 'text-red-700 bg-red-50 border-red-300',
  High:     'text-orange-700 bg-orange-50 border-orange-300',
  Medium:   'text-yellow-700 bg-yellow-50 border-yellow-300',
  Low:      'text-blue-700 bg-blue-50 border-blue-300',
};

const INITIAL_STAGES = [
  { label: 'Started',   timestamp: '', isActive: true,  isCompleted: false },
  { label: 'Escalated', timestamp: '', isActive: false, isCompleted: false },
  { label: 'Diagnosed', timestamp: '', isActive: false, isCompleted: false },
  { label: 'Mitigated', timestamp: '', isActive: false, isCompleted: false },
  { label: 'Resolved',  timestamp: '', isActive: false, isCompleted: false },
  { label: 'Closed',    timestamp: '', isActive: false, isCompleted: false },
];

const NewIncidentModal: React.FC<NewIncidentModalProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle]       = useState('');
  const [priority, setPriority] = useState<Priority>('High');
  const [product, setProduct]   = useState('');
  const [assignee, setAssignee] = useState('');
  const [errors, setErrors]     = useState<{ title?: string }>({});
  const [users, setUsers]       = useState<Array<{ id: string; fullName: string; role: string }>>([]);
  const [services, setServices] = useState<Array<{ name: string; type?: string }>>([]);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    let active = true;
    api.get('/api/users').then((res: any) => {
      if (!active) return;
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      if (list.length > 0) {
        setUsers(list.map((u: any) => ({
          id: String(u.id),
          fullName: u.fullName || u.username || 'Agent',
          role: u.role || 'Agent',
        })));
      }
    }).catch(() => {});

    // Product / CI options. The old <datalist id="cmdb-products-list"> was
    // declared but left empty, so the field never suggested anything.
    api.get('/api/cmdb/configuration-items').then((res: any) => {
      if (!active) return;
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setServices(
        list
          .map((ci: any) => ({ name: ci.name || ci.ciName || '', type: ci.type || ci.ciType }))
          .filter((ci: { name: string }) => ci.name)
      );
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const validate = () => {
    if (!title.trim()) {
      setErrors({ title: 'Title is required' });
      titleRef.current?.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const id = `MI-${Date.now().toString().slice(-6)}`;
    const incident: MajorIncident = {
      id,
      title: title.trim(),
      priority,
      product: product.trim() || 'General',
      resolutionTarget: 'TBD',
      responseTarget: 'TBD',
      assignee: assignee.trim() || 'Unassigned',
      lifecycleStages: INITIAL_STAGES,
    };

    onSubmit(incident);
    onClose();
  };

  return (
    /* Backdrop */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-sm" />
            <h2 className="text-sm font-semibold text-gray-800">New Major Incident</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors({}); }}
              placeholder="Brief description of the incident…"
              className={`w-full text-sm border rounded-lg px-3 py-2 outline-none transition-colors placeholder-gray-300
                ${errors.title
                  ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-100'
                  : 'border-gray-200 focus:border-[#eb6a47] focus:ring-1 focus:ring-[#f8c5b1]'
                } bg-gray-50`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Priority</label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                    ${priority === p
                      ? PRIORITY_COLORS[p]
                      : 'text-gray-500 bg-white border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Product / CI Service
            </label>
            <Combobox
              value={product}
              onChange={setProduct}
              placeholder="Select or enter CI Service (e.g. Database, API Gateway)…"
              options={services.map((s) => ({ value: s.name, hint: s.type }))}
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assignee</label>
            <Combobox
              value={assignee}
              onChange={setAssignee}
              placeholder="Select or type team member…"
              options={[
                ...users.map((u) => ({ value: u.fullName, hint: u.role })),
                { value: 'Unassigned' },
              ]}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#eb6a47] hover:bg-[#db5936] text-white text-xs font-semibold px-5 py-2 rounded-full transition-colors shadow-sm"
            >
              Create Incident
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default NewIncidentModal;
