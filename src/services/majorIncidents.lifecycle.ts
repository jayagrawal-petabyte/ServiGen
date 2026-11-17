export const STAGE_LABELS = [
  'Started',
  'Escalated',
  'Diagnosed',
  'Mitigated',
  'Resolved',
  'Closed',
] as const;

export type StageLabel = (typeof STAGE_LABELS)[number];

export const RESOLVED_STAGES: readonly string[] = ['Resolved', 'Closed'];

const LEGACY_STATUS_MAP: Record<string, StageLabel> = {
  investigating: 'Started',
  identified: 'Diagnosed',
  monitoring: 'Mitigated',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function normaliseStatus(value: string | null | undefined): StageLabel | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  const exact = STAGE_LABELS.find((s) => s.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  return LEGACY_STATUS_MAP[trimmed.toLowerCase()] ?? null;
}

export function isResolvedStage(status: string | null | undefined): boolean {
  const canonical = normaliseStatus(status);
  return canonical !== null && RESOLVED_STAGES.includes(canonical);
}

export function mapStageToBackendStatus(stageIndex: number): StageLabel {
  if (!Number.isInteger(stageIndex) || stageIndex < 0 || stageIndex >= STAGE_LABELS.length) {
    return STAGE_LABELS[0];
  }
  return STAGE_LABELS[stageIndex];
}

export function resolvedAtForStage(stageIndex: number): string | null {
  return isResolvedStage(STAGE_LABELS[stageIndex]) ? new Date().toISOString() : null;
}
