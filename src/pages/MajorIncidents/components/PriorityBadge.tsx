// PriorityBadge — coloured text label for Critical / High / Medium / Low

import React from 'react';
import type { Priority } from '../types/majorIncident.types';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

// One Tailwind class per priority level — Record ensures all 4 are covered
const PRIORITY_STYLES: Record<Priority, string> = {
  Critical: 'text-red-600 font-semibold',
  High: 'text-orange-500 font-semibold',
  Medium: 'text-yellow-500 font-semibold',
  Low: 'text-green-500 font-semibold',
};

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  return (
    <span className={`text-sm ${PRIORITY_STYLES[priority]} ${className}`}>
      {priority}
    </span>
  );
};

export default PriorityBadge;
