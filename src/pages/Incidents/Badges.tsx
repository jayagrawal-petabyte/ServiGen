import type {
  IncidentStatus,
  Priority,
} from "./incidents.data";

type PriorityPillProps = {
  priority: Priority;
};

type StatusPillProps = {
  status: IncidentStatus;
};

const PRIORITY_STYLES: Record<
  Priority,
  string
> = {
  Critical: "priority-critical",
  High: "priority-high",
  Medium: "priority-medium",
  Low: "priority-low",
  Unassigned: "priority-unassigned",
};

const STATUS_STYLES: Record<
  IncidentStatus,
  string
> = {
  "In Progress": "status-progress",
  Open: "status-open",
  Resolved: "status-resolved",
  "On Hold": "status-hold",
};

export function PriorityPill({
  priority,
}: PriorityPillProps) {
  return (
    <span
      className={`incident-pill ${PRIORITY_STYLES[priority]}`}
    >
      {priority}
    </span>
  );
}

export function StatusPill({
  status,
}: StatusPillProps) {
  return (
    <span
      className={`incident-pill ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}