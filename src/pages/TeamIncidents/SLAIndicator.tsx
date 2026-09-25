interface SLAIndicatorProps {
  time: string;
}

function SLAIndicator({ time }: SLAIndicatorProps) {
  const getClassName = (): string => {
    if (time.includes("00h")) {
      return "sla-critical";
    }

    if (time.includes("01h")) {
      return "sla-warning";
    }

    return "sla-normal";
  };

  return (
    <span className={`sla-indicator ${getClassName()}`}>
      {time}
    </span>
  );
}

export default SLAIndicator;