import React from 'react';
import type { MajorIncident, UserRole } from '../types/majorIncident.types';
import PriorityBadge from './PriorityBadge';
import LifecyclePipeline from './LifecyclePipeline';

interface IncidentCardProps {
  incident: MajorIncident;
  isSelected?: boolean;
  onClick?: () => void;
  role?: UserRole;
  onAdvanceStage?: () => void;
}

const resolutionTargetStyle = (target: string): string =>
  target.startsWith('-') ? 'text-red-500 font-medium' : 'text-gray-700 font-medium';

const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  isSelected = false,
  onClick,
  role = 'Agent',
  onAdvanceStage,
}) => {
  const activeStageIdx = incident.lifecycleStages.findIndex((s) => s.isActive);
  const isClosed = incident.lifecycleStages[5]?.isCompleted;
  const canAdvance = (role === 'Manager' || role === 'Admin') && !isClosed && activeStageIdx !== -1 && activeStageIdx < 5;

  const topBadges = [
    <PriorityBadge key="priority" priority={incident.priority} />,
    null,
    <span
      key="product"
      title={incident.product}
      className="text-[11px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full whitespace-nowrap truncate max-w-[200px]"
    >
      {incident.product}
    </span>,
    null,
    <span key="status" className="text-[11px] font-bold text-green-600 border border-green-300 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
      New
    </span>,
    <span key="assignee" className="text-[13px] font-bold text-gray-900 whitespace-nowrap">
      {incident.assignee}
    </span>,
  ];

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-5 mb-4 shadow-xs hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isSelected ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-gray-200'
      }`}
    >
      {/* Top Header Line */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-xs font-bold font-mono text-cyan-700 bg-cyan-50 border border-cyan-200 rounded px-2 py-0.5">
            #{incident.id}
          </span>
          <h3 className="text-sm font-bold text-gray-900 leading-tight">
            {incident.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${
            incident.priority === 'Critical' ? 'text-red-600' : incident.priority === 'High' ? 'text-orange-600' : 'text-yellow-600'
          }`}>
            {incident.priority}
          </span>
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
            {incident.product || 'MyFinance PROD'}
          </span>
        </div>
      </div>

      {/* Target Subtitle Line */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-4">
          <span>
            Resolution Target <strong className={resolutionTargetStyle(incident.resolutionTarget)}>{incident.resolutionTarget}</strong>
          </span>
          <span>
            Response Target <strong className="text-gray-700 font-semibold">{incident.responseTarget}</strong>
          </span>
        </div>

        {canAdvance && onAdvanceStage && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdvanceStage();
            }}
            className="bg-[#13273e] hover:bg-[#0c1a2b] text-white text-[11px] font-bold px-3 py-1 rounded-full transition-colors flex items-center gap-1 shadow-xs"
            title={`Advance as ${role}`}
          >
            <span>Advance Stage</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Lifecycle Pipeline Chevrons */}
      <div className="w-full overflow-x-auto">
        <LifecyclePipeline stages={incident.lifecycleStages} />
      </div>
    </div>
  );
};

export default IncidentCard;
