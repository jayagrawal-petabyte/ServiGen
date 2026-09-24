function PriorityIndicator({ priority }) {
  return (
    <span className={`priority-indicator priority-${priority.toLowerCase()}`}>
      {priority}
    </span>
  );
}

export default PriorityIndicator;