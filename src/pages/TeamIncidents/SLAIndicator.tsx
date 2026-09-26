interface SLAIndicatorProps {
  time: string;
}

function SLAIndicator({ time }: SLAIndicatorProps) {
  const getClassName = (): string => {
    if (time.startsWith("-")) {
      return "sla-critical";
    }

    if (time === "05:05") {
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