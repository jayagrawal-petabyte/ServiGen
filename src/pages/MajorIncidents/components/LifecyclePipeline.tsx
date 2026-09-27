/**
 * LifecyclePipeline — chevron-shaped stage tracker.
 *
 * Each stage uses clip-path to produce an arrow/chevron shape.
 * ARROW_W = width of the arrow point/notch.
 * Using equal width for left notch and right arrow ensures parallel diagonal lines.
 * We use negative margins to overlap them and leave a precise GAP.
 */

import React from 'react';
import type { LifecycleStage } from '../types/majorIncident.types';

interface LifecyclePipelineProps {
  stages: LifecycleStage[];
  topBadges?: React.ReactNode[];
}

const ARROW_W = 16;  // px — width of the arrow point
const GAP     = 3;   // px — visual gap between blocks
const BLOCK_H = 54;  // px — height of each chevron block
const NEG_MARGIN = ARROW_W - GAP;

const clipPath = (isFirst: boolean, isLast: boolean): string => {
  if (isFirst && isLast) return 'none';

  // We use 0 and 100% for Y-coordinates to ensure perfect angles.
  // clip-path will inherently preserve border-radius on any straight vertical edges (like the left edge of isFirst).

  if (isFirst) {
    return `polygon(
      0 0, 
      calc(100% - ${ARROW_W}px) 0, 
      100% 50%, 
      calc(100% - ${ARROW_W}px) 100%, 
      0 100%
    )`;
  }

  if (isLast) {
    return `polygon(
      0 0, 
      100% 0, 
      100% 100%, 
      0 100%, 
      ${ARROW_W}px 50%
    )`;
  }

  return `polygon(
    0 0, 
    calc(100% - ${ARROW_W}px) 0, 
    100% 50%, 
    calc(100% - ${ARROW_W}px) 100%, 
    0 100%, 
    ${ARROW_W}px 50%
  )`;
};

interface StageBg {
  bg:        string;
  text:      string;
  labelText: string;
}

const getStageBg = (isFirst: boolean, isActive: boolean, isCompleted: boolean): StageBg => {
  if (isActive)    return { bg: '#06b6d4', text: 'text-white',     labelText: 'text-cyan-100' }; // cyan-500
  return              { bg: '#e2e8f0', text: 'text-gray-700',   labelText: 'text-gray-500' }; // slate-200 / slate-700
};

const LifecyclePipeline: React.FC<LifecyclePipelineProps> = ({ stages, topBadges = [] }) => {
  return (
    <div className="flex items-end mt-1 overflow-x-auto pb-1">
      {stages.map((stage, index) => {
        const isFirst = index === 0;
        const isLast  = index === stages.length - 1;
        const style   = getStageBg(isFirst, stage.isActive, stage.isCompleted);

        let pl = 16;
        let pr = 16;
        if (isFirst && !isLast) {
          pr = ARROW_W + 12;
        } else if (isLast && !isFirst) {
          pl = ARROW_W + 12;
        } else if (!isFirst && !isLast) {
          pl = ARROW_W + 8;
          pr = ARROW_W + 8;
        }

        return (
          <div
            key={stage.label}
            className="flex flex-col items-center shrink-0 w-[150px]"
            style={{
              marginLeft: isFirst ? 0 : -NEG_MARGIN,
              zIndex: stages.length - index,
            }}
          >
            {/* Badge Row Above the Chevron */}
            <div className="h-6 flex items-end justify-center mb-1.5 w-full">
              {topBadges[index] || null}
            </div>

            {/* The Chevron Shape */}
            <div
              className={`
                flex items-center justify-center w-full
                ${isFirst ? 'rounded-l-lg' : ''}
                ${isLast ? 'rounded-r-lg' : ''}
              `}
              style={{
                height:       BLOCK_H,
                paddingLeft:  pl,
                paddingRight: pr,
                background:   style.bg,
                clipPath:     clipPath(isFirst, isLast),
                position:     'relative',
              }}
            >
              {/* The main label is perfectly vertically centered */}
              <span className={`font-bold text-[13px] leading-tight text-center ${style.text}`}>
                {stage.label}
              </span>
              
              {/* The timestamp is absolutely positioned at the bottom so it doesn't affect the vertical centering of the main label */}
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
};

export default LifecyclePipeline;
