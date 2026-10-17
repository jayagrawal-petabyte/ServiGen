import React from 'react';
import { motion } from 'framer-motion';
import type { ChangeRequest, SubTask, ChangeStatus } from '../../types/cmdb';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getChangeStatusVariant } from '../../utils/statusUtils';
import { X, Clock, Tag, User, CheckSquare } from 'lucide-react';

interface ChangeRequestDetailModalProps {
  changeRequest: ChangeRequest | null;
  onClose: () => void;
  onToggleSubtask?: (subtaskId: string) => void;
  onChangeStatus?: (status: ChangeStatus) => void;
}

export const ChangeRequestDetailModal: React.FC<ChangeRequestDetailModalProps> = ({
  changeRequest,
  onClose,
  onToggleSubtask,
  onChangeStatus,
}) => {
  if (!changeRequest) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl"
      >
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
              {onChangeStatus ? (
                <select
                  value={changeRequest.status}
                  onChange={(e) => onChangeStatus(e.target.value as ChangeStatus)}
                  className="px-2.5 py-1 bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                </select>
              ) : (
                <StatusBadge label={changeRequest.status} variant={getChangeStatusVariant(changeRequest.status)} />
              )}
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

          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#E87A5D]" /> Implementation Checklist & Subtasks
            </h3>
            <div className="space-y-2">
              {changeRequest.subtasks.map((task: SubTask) => (
                <div
                  key={task.id}
                  onClick={() => onToggleSubtask && onToggleSubtask(task.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    onToggleSubtask ? 'cursor-pointer hover:border-[#E87A5D]' : ''
                  } ${
                    task.completed
                      ? 'bg-slate-50/60 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleSubtask && onToggleSubtask(task.id)}
                    className="w-4 h-4 text-[#E87A5D] rounded focus:ring-[#E87A5D] cursor-pointer"
                  />
                  <span className={`font-medium flex-1 ${task.completed ? 'line-through text-slate-400' : ''}`}>
                    {task.title}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{task.id}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                Window: <strong>{changeRequest.scheduledStart}</strong> to <strong>{changeRequest.scheduledEnd}</strong>
              </span>
            </div>
            <div className="flex gap-1.5">
              {changeRequest.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold text-[10px]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};