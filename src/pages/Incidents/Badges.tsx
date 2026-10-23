import type {
  IncidentStatus,
  Priority,
} from "./incidents.data";
import { StatusBadge, StatusPill as SharedStatusPill } from "../../components/shared/StatusBadge";

export { StatusBadge };

type PriorityPillProps = {
  priority: Priority;
};

type StatusPillProps = {
  status: IncidentStatus | string;
};

const PRIORITY_STYLES: Record<Priority, string> = {
  Critical: "priority-critical",
  High: "priority-high",
  Medium: "priority-medium",
  Low: "priority-low",
  Unassigned: "priority-unassigned",
};

export function PriorityPill({
  priority,
}: PriorityPillProps) {
  const label = PRIORITY_STYLES[priority]
    ? priority
    : "Unassigned";

  return (
    <span
      className={`incident-pill ${PRIORITY_STYLES[label]}`}
    >
      {label}
    </span>
  );
}

export function StatusPill({
  status,
}: StatusPillProps) {
  return <SharedStatusPill status={status} size="sm" />;
}