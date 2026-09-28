import React from 'react';
import type { LifecycleStage } from '../types/majorIncident.types';

interface LifecyclePipelineProps {
  stages: LifecycleStage[];
  topBadges?: React.ReactNode[];
}

const ARROW_W    = 16;
const GAP        = 3;
const BLOCK_H    = 54;
const NEG_MARGIN = ARROW_W - GAP;

const clipPath = (isFirst: boolean, isLast: boolean): string => {
  if (isFirst && isLast) return 'none';
  if (isFirst)
    return `polygon(0 0, calc(100% - ${ARROW_W}px) 0, 100% 50%, calc(100% - ${ARROW_W}px) 100%, 0 100%)`;
  if (isLast)
    return `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${ARROW_W}px 50%)`;
  return `polygon(0 0, calc(100% - ${ARROW_W}px) 0, 100% 50%, calc(100% - ${ARROW_W}px) 100%, 0 100%, ${ARROW_W}px 50%)`;
};

const getStageBg = (_isFirst: boolean, isActive: boolean, _isCompleted: boolean) =>
  isActive
    ? { bg: '#06b6d4', text: 'text-white',   labelText: 'text-cyan-100' }
    : { bg: '#e2e8f0', text: 'text-gray-700', labelText: 'text-gray-500' };

const LifecyclePipeline: React.FC<LifecyclePipelineProps> = ({ stages, topBadges = [] }) => (
  <div className="flex items-end mt-1 overflow-x-auto pb-1">
    {stages.map((stage, index) => {
      const isFirst = index === 0;
      const isLast  = index === stages.length - 1;
      const style   = getStageBg(isFirst, stage.isActive, stage.isCompleted);

      const pl = isFirst && !isLast ? 16 : isLast && !isFirst ? ARROW_W + 12 : !isFirst && !isLast ? ARROW_W + 8 : 16;
      const pr = isFirst && !isLast ? ARROW_W + 12 : isLast && !isFirst ? 16 : !isFirst && !isLast ? ARROW_W + 8 : 16;

      return (
        <div
          key={stage.label}
          className="flex flex-col items-center shrink-0 w-[150px]"
          style={{ marginLeft: isFirst ? 0 : -NEG_MARGIN, zIndex: stages.length - index }}
        >
          <div className="h-6 flex items-end justify-center mb-1.5 w-full">
            {topBadges[index] || null}
          </div>

          <div
            className={`flex items-center justify-center w-full ${isFirst ? 'rounded-l-lg' : ''} ${isLast ? 'rounded-r-lg' : ''}`}
            style={{ height: BLOCK_H, paddingLeft: pl, paddingRight: pr, background: style.bg, clipPath: clipPath(isFirst, isLast), position: 'relative' }}
          >
            <span className={`font-bold text-[13px] leading-tight text-center ${style.text}`}>
              {stage.label}
            </span>
            {stage.timestamp && (
              <span className={`absolute bottom-[3px] left-0 right-0 px-2 text-[10px] font-medium leading-tight text-center whitespace-nowrap ${style.labelText}`}>
                {stage.timestamp}
              </span>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

export default LifecyclePipeline;
