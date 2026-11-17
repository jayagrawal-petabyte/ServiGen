import React from 'react';

interface PriorityIndicatorProps {
  priority: string;
}

const PriorityIndicator: React.FC<PriorityIndicatorProps> = React.memo(({
  priority,
}) => {
  const pLower = (priority || '').toLowerCase();

  let dotColor = '#16a34a';
  let textColor = '#166534';
  if (pLower === 'critical') {
    dotColor = '#dc2626';
    textColor = '#991b1b';
  } else if (pLower === 'high') {
    dotColor = '#ea580c';
    textColor = '#9a3412';
  } else if (pLower === 'medium') {
    dotColor = '#d97706';
    textColor = '#92400e';
  }

  return (
    <span
      className={`priority-indicator priority-${pLower}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontWeight: 500,
        color: textColor,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        className="priority-dot"
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span>{priority}</span>
    </span>
  );
});

export default PriorityIndicator;
