/**
 * IncidentCard — single Major Incident card (SCR-021)
 *
 * Two-column layout matching Figma:
 *   LEFT  — ID + Title, then Resolution Target, then Response Target (stacked)
 *   RIGHT — badges (Critical / Product / New / Assignee) on top, pipeline below
 */

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
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4">

        {/* ── LEFT COLUMN ── fixed width, stacked info */}
        <div className="flex flex-col justify-center gap-1 w-56 shrink-0">
          {/* ID + Title — single line, title truncates if needed */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-xs font-mono text-cyan-600 border border-cyan-400 rounded-full px-2 py-0.5">
              #{incident.id}
            </span>
            <span className="text-gray-900 font-semibold text-sm leading-tight break-words">
              {incident.title}
            </span>
          </div>

          {/* Resolution Target */}
          <p className="text-xs text-gray-500">
            Resolution Target:{' '}
            <span className={resolutionTargetStyle(incident.resolutionTarget)}>
              {incident.resolutionTarget}
            </span>
          </p>

          {/* Response Target */}
          <p className="text-xs text-gray-500">
            Response Target:{' '}
            <span className="text-gray-700 font-medium">{incident.responseTarget}</span>
          </p>
        </div>

        {/* ── RIGHT COLUMN ── badges on top, pipeline below */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Badge row — sits directly above the pipeline boxes */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <PriorityBadge priority={incident.priority} />

            <span className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded whitespace-nowrap">
              {incident.product}
            </span>

            <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-300 px-2 py-0.5 rounded whitespace-nowrap">
              New
            </span>

            {incident.assignee && incident.assignee !== 'Unassigned' && (
              <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                {incident.assignee}
              </span>
            )}
          </div>

          {/* Pipeline — directly below the badges */}
          <LifecyclePipeline stages={incident.lifecycleStages} />
        </div>

      </div>
    </div>
  );
};

export default IncidentCard;
