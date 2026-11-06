import type { Stage, StagePayload } from '../types';

export function createStagePayload(
  stage: Stage,
  displayOrder: number = stage.displayOrder,
): StagePayload {
  return {
    defaultPrice: stage.defaultPrice,
    description: stage.description ?? undefined,
    displayOrder,
    durationHours: stage.defaultDurationHours,
    isRewardEligible: stage.isRewardEligible,
    name: stage.name,
  };
}

export function moveStage(
  stages: readonly Stage[],
  stageId: string,
  offset: number,
): readonly Stage[] {
  const from = stages.findIndex((stage) => stage.id === stageId);
  const to = from + offset;
  if (from < 0 || to < 0 || to >= stages.length) return stages;
  const next = [...stages];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function renumberStages(stages: readonly Stage[]): readonly Stage[] {
  return stages.map((stage, index) => ({ ...stage, displayOrder: index + 1 }));
}

export function getNextDisplayOrder(stages: readonly Stage[]): number {
  return Math.max(0, ...stages.map((stage) => stage.displayOrder)) + 1;
}
