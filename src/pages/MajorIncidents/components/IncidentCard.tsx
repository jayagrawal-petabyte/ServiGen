import React from 'react';
import type { MajorIncident } from '../types/majorIncident.types';
import PriorityBadge from './PriorityBadge';
import LifecyclePipeline from './LifecyclePipeline';

interface IncidentCardProps {
  incident: MajorIncident;
}

const resolutionTargetStyle = (target: string): string =>
  target.startsWith('-') ? 'text-red-500 font-medium' : 'text-gray-700 font-medium';

const IncidentCard: React.FC<IncidentCardProps> = ({ incident }) => {
  const topBadges = [
    null,
    <PriorityBadge key="priority" priority={incident.priority} />,
    <span key="product" className="text-[11px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap">
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
    <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-6">
        <div className="flex flex-col justify-center gap-1.5 w-64 shrink-0">
          <div className="flex items-center gap-2 min-w-0 mb-1">
            <span className="shrink-0 text-[11px] font-bold font-mono text-white bg-cyan-500 rounded-full px-2 py-0.5">
              #{incident.id}
            </span>
            <span className="text-gray-900 font-bold text-sm leading-tight break-words">
              {incident.title}
            </span>
          </div>
          <p className="text-[13px] text-gray-500">
            Resolution Target <span className={resolutionTargetStyle(incident.resolutionTarget)}>{incident.resolutionTarget}</span>
          </p>
          <p className="text-[13px] text-gray-500">
            Response Target <span className="text-gray-800 font-medium">{incident.responseTarget}</span>
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <LifecyclePipeline stages={incident.lifecycleStages} topBadges={topBadges} />
        </div>
      </div>
    </div>
  );
};

export default IncidentCard;
