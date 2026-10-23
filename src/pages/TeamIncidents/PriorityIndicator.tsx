import React from 'react';

interface PriorityIndicatorProps {
  priority: string;
}

const PriorityIndicator: React.FC<PriorityIndicatorProps> = React.memo(({
  priority,
}) => {
  return (
    <span
      className={`priority-indicator priority-${priority.toLowerCase()}`}
    >
      <span className="priority-dot"></span>
      {priority}
    </span>
  );
});

export default PriorityIndicator;