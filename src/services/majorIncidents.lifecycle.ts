/**
 * Major-incident lifecycle vocabulary — the frontend's single source of truth.
 *
 * SIX ordered stages, matching the Figma design and the backend's
 * LIFECYCLE_STAGES (backend/src/modules/major-incidents):
 *
 *   Started -> Escalated -> Diagnosed -> Mitigated -> Resolved -> Closed
 *
 * This module deliberately has NO imports beyond types. It used to live inside
 * majorIncidentsService.ts, which created a cycle once that service imported
 * its own offline fixtures (the fixtures read STAGE_LABELS while the service
 * was still evaluating → "Cannot access 'STAGE_LABELS' before initialization").
 * Keeping the vocabulary dependency-free means both the service and the
 * fixtures can import it safely.
 */

export const STAGE_LABELS = [
  'Started',
  'Escalated',
  'Diagnosed',
  'Mitigated',
  'Resolved',
  'Closed',
] as const;

export type StageLabel = (typeof STAGE_LABELS)[number];

/** Stages at which an incident counts as resolved (i.e. carries a resolvedAt). */
export const RESOLVED_STAGES: readonly string[] = ['Resolved', 'Closed'];

/**
 * Pre-2026-10 four-status vocabulary. Retained so the UI renders correctly
 * against a backend that has not yet deployed the six-stage change, and for
 * rows written before the data migration.
 */
const LEGACY_STATUS_MAP: Record<string, StageLabel> = {
  investigating: 'Started',
  identified: 'Diagnosed',
  monitoring: 'Mitigated',
  resolved: 'Resolved',
  closed: 'Closed',
};

/** Normalise any accepted status spelling to a canonical stage label. */
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

/**
 * Collapse a pipeline index into the backend status.
 * Inverse of the service's buildLifecycleStages.
 */
export function mapStageToBackendStatus(stageIndex: number): StageLabel {
  if (!Number.isInteger(stageIndex) || stageIndex < 0 || stageIndex >= STAGE_LABELS.length) {
    return STAGE_LABELS[0];
  }
  return STAGE_LABELS[stageIndex];
}

/**
 * The resolvedAt value that should accompany a move to `stageIndex`.
 * Returning null (rather than omitting it) is what re-opens an incident.
 */
export function resolvedAtForStage(stageIndex: number): string | null {
  return isResolvedStage(STAGE_LABELS[stageIndex]) ? new Date().toISOString() : null;
}
