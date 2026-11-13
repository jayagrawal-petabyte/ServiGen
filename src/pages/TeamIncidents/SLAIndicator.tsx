import React, { useState, useEffect } from "react";
import { parseInitialSeconds, formatSecondsToSla } from "../../components/shared/SlaBadge";

interface SLAIndicatorProps {
  time: string;
  status?: string;
}

function SLAIndicator({ time, status }: SLAIndicatorProps) {
  const isOnHold = Boolean(
    status && (status.toLowerCase().includes('hold') || status.toLowerCase().includes('paused'))
  );

  const initialSec = parseInitialSeconds(time);
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSec);

  useEffect(() => {
    setSecondsLeft(parseInitialSeconds(time));
  }, [time]);

  // 1-second live ticking countdown timer
  useEffect(() => {
    if (isOnHold || secondsLeft <= -86400) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOnHold, secondsLeft]);

  if (isOnHold) {
    return (
      <span className="sla-indicator sla-paused bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-full text-xs font-medium" title="SLA paused while ticket on hold">
        ⏸ Paused
      </span>
    );
  }

  const { text, urgency } = formatSecondsToSla(secondsLeft);

  const getClassName = (): string => {
    if (urgency === 'overdue') {
      return "sla-critical bg-rose-100 text-rose-800 border border-rose-300 animate-pulse font-bold px-2 py-0.5 rounded-full text-xs";
    }
    if (urgency === 'warning') {
      return "sla-warning bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2 py-0.5 rounded-full text-xs";
    }
    return "sla-normal bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium px-2 py-0.5 rounded-full text-xs";
  };

  return (
    <span className={`sla-indicator font-mono tabular-nums ${getClassName()}`} title={`SLA Remaining: ${text}`}>
      {text}
    </span>
  );
}

export default SLAIndicator;
