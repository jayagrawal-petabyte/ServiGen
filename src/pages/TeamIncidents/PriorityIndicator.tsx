interface PriorityIndicatorProps {
  priority: string;
}

function PriorityIndicator({
  priority,
}: PriorityIndicatorProps) {
  return (
    <span
      className={`priority-indicator priority-${priority.toLowerCase()}`}
    >
      {priority}
    </span>
  );
}

export default PriorityIndicator;