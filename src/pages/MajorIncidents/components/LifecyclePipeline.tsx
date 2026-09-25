/**
 * LifecyclePipeline — chevron-shaped stage tracker.
 *
 * Each stage uses clip-path to produce an arrow/chevron shape.
 * LEFT_NOTCH  = shallow indent on the left (receives the previous stage's point)
 * RIGHT_ARROW = deeper point on the right (clearly shows "continues onward")
 */

import React from 'react';
import type { LifecycleStage } from '../types/majorIncident.types';

interface LifecyclePipelineProps {
  stages: LifecycleStage[];
}

const LEFT_NOTCH  = 10;  // px — shallow left indent
const RIGHT_ARROW = 18;  // px — deeper right point so the arrow is clearly visible
const BLOCK_H     = 44;  // px — height of each chevron block

const clipPath = (isFirst: boolean, isLast: boolean): string => {
  if (isFirst && isLast) return 'none';

  if (isFirst)
    // Straight left edge, right arrow point
    return `polygon(0 0, calc(100% - ${RIGHT_ARROW}px) 0, 100% 50%, calc(100% - ${RIGHT_ARROW}px) 100%, 0 100%)`;

  if (isLast)
    // Left notch, straight right edge
    return `polygon(${LEFT_NOTCH}px 0, 100% 0, 100% 100%, ${LEFT_NOTCH}px 100%, 0 50%)`;

  // Left notch + right arrow point
  return `polygon(${LEFT_NOTCH}px 0, calc(100% - ${RIGHT_ARROW}px) 0, 100% 50%, calc(100% - ${RIGHT_ARROW}px) 100%, ${LEFT_NOTCH}px 100%, 0 50%)`;
};

interface StageBg {
  bg:        string;
  text:      string;
  labelText: string;
}

const getStageBg = (isFirst: boolean, isActive: boolean, isCompleted: boolean): StageBg => {
  if (isFirst)     return { bg: '#2563eb', text: 'text-white',     labelText: 'text-blue-100' };
  if (isCompleted) return { bg: '#bfdbfe', text: 'text-blue-800',  labelText: 'text-blue-600' };
  if (isActive)    return { bg: '#bbf7d0', text: 'text-green-800', labelText: 'text-green-600' };
  return              { bg: '#e5e7eb', text: 'text-gray-500',   labelText: 'text-gray-400' };
};

const LifecyclePipeline: React.FC<LifecyclePipelineProps> = ({ stages }) => {
  return (
    <div className="flex items-center mt-3 overflow-x-auto">
      {stages.map((stage, index) => {
        const isFirst = index === 0;
        const isLast  = index === stages.length - 1;
        const style   = getStageBg(isFirst, stage.isActive, stage.isCompleted);

        return (
          <div
            key={stage.label}
            className="flex flex-col items-center justify-center shrink-0"
            style={{
              height:       BLOCK_H,
              minWidth:     130,
              paddingLeft:  isFirst ? 14 : LEFT_NOTCH + 10,
              paddingRight: isLast  ? 14 : RIGHT_ARROW + 6,
              marginLeft:   index === 0 ? 0 : -LEFT_NOTCH,
              background:   style.bg,
              clipPath:     clipPath(isFirst, isLast),
              zIndex:       stages.length - index,
              position:     'relative',
            }}
          >
            <span className={`font-semibold text-[11px] leading-tight text-center ${style.text}`}>
              {stage.label}
            </span>
            {stage.timestamp && (
              <span className={`text-[9px] leading-tight mt-0.5 text-center whitespace-nowrap ${style.labelText}`}>
                {stage.timestamp}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LifecyclePipeline;
