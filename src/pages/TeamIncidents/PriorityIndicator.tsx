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
      <span className="priority-dot"></span>
      {priority}
    </span>
  );
}

export default PriorityIndicator;