import { describe, expect, it } from 'vitest';

import type { Stage } from '@/features/stages/types';
import {
  createStagePayload,
  getNextDisplayOrder,
  moveStage,
  renumberStages,
} from '@/features/stages/utils/order';

function stage(id: string, displayOrder: number): Stage {
  return {
    id,
    code: id.toUpperCase(),
    name: id,
    description: null,
    defaultPrice: '100.00',
    defaultDurationHours: 24,
    currency: 'VND',
    displayOrder,
    isActive: true,
    isRewardEligible: false,
    createdAt: '',
    updatedAt: '',
  };
}

const stages = [stage('a', 0), stage('b', 0), stage('c', 7)];

describe('stage ordering', () => {
  it('moves a stage and ignores moves past either end', () => {
    expect(moveStage(stages, 'b', -1).map((item) => item.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
    expect(moveStage(stages, 'a', -1)).toBe(stages);
    expect(moveStage(stages, 'c', 1)).toBe(stages);
  });

  it('renumbers duplicate display orders from one', () => {
    expect(renumberStages(stages).map((item) => item.displayOrder)).toEqual([
      1, 2, 3,
    ]);
  });

  it('places a new stage after the highest display order', () => {
    expect(getNextDisplayOrder(stages)).toBe(8);
    expect(getNextDisplayOrder([])).toBe(1);
  });

  it('keeps every stage field when building a reorder payload', () => {
    expect(createStagePayload(stages[0], 4)).toEqual({
      defaultPrice: '100.00',
      description: undefined,
      displayOrder: 4,
      durationHours: 24,
      isRewardEligible: false,
      name: 'a',
    });
  });
});
