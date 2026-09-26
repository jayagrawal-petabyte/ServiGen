import React from 'react';
import type { ChangeRequest } from '../../types/cmdb';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getChangeStatusVariant } from '../../utils/statusUtils';
import { X, Clock, Tag, User, CheckSquare } from 'lucide-react';

interface ChangeRequestDetailModalProps {
  changeRequest: ChangeRequest | null;
  onClose: () => void;
}

export const ChangeRequestDetailModal: React.FC<ChangeRequestDetailModalProps> = ({
  changeRequest,
  onClose,
}) => {
  if (!changeRequest) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 rounded-t-3xl">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-extrabold text-[#E87A5D]">{changeRequest.id}</span>
              <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-full">
                {changeRequest.type} Change
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {changeRequest.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#FCE6DC]/50 rounded-2xl border border-[#FCE6DC]">
            <div>
              <span className="text-slate-500 font-bold block mb-1 uppercase">Status</span>
              <StatusBadge label={changeRequest.status} variant={getChangeStatusVariant(changeRequest.status)} />
            </div>
            <div>
              <span className="text-slate-500 font-bold block mb-1 uppercase">Risk Level</span>
              <StatusBadge label={`${changeRequest.risk} Risk`} variant={changeRequest.risk === 'High' ? 'red' : 'yellow'} />
            </div>
            <div>
              <span className="text-slate-500 font-bold block mb-1 uppercase">Completion</span>
              <span className="text-base font-extrabold text-[#E87A5D]">{changeRequest.completionPercent}%</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block mb-1 uppercase">Time Spent</span>
              <span className="text-sm font-bold text-slate-800">{changeRequest.timeSpentHours}h / {changeRequest.targetHours}h</span>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Description</h3>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {changeRequest.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Linked Configuration Item
              </span>
              <span className="font-bold text-slate-900 text-sm">{changeRequest.linkedCiName}</span>
              <span className="text-slate-400 block text-[10px]">{changeRequest.linkedCiId}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Assigned Owner
              </span>
              <span className="font-bold text-slate-900 text-sm">{changeRequest.agentName}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-bold uppercase block">Scheduled Start</span>
              <span className="font-bold text-slate-800">{changeRequest.scheduledStart}</span>
            </div>
            <Clock className="w-5 h-5 text-[#E87A5D]" />
            <div>
              <span className="text-slate-400 font-bold uppercase block">Target Completion</span>
              <span className="font-bold text-slate-800">{changeRequest.scheduledEnd}</span>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-[#E87A5D]" /> Subtask Implementation Plan
            </h3>
            <div className="space-y-2">
              {changeRequest.subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-[#E87A5D]">{st.id}</span>
                    <span className={st.completed ? 'line-through text-slate-400 font-medium' : 'font-semibold text-slate-800'}>
                      {st.title}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {st.completed ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-full transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
