import { describe, expect, it } from 'vitest';

import type {
  StatisticsStageColumn,
  StatisticsTaskCell,
} from '@/features/statistics/types';
import { toTaskActionTarget } from '@/features/statistics/utils/task-action-target';

describe('statistics task action target', () => {
  it('maps the selected statistics cell to the task mutation target', () => {
    const cell: StatisticsTaskCell = {
      agreedPrice: '42.50',
      assigneeDiscordUserId: 'member/id',
      assigneeDisplayName: 'Editor',
      chapterId: 'chapter/id',
      completedAt: null,
      createdAt: '2026-09-02T00:00:00.000Z',
      currency: 'USD',
      paidAt: null,
      paymentStatus: 'PENDING',
      stageDefinitionId: 'stage/id',
      storyId: 'story/id',
      taskId: 'task/id',
      taskStatus: 'READY',
    };
    const stage: StatisticsStageColumn = {
      code: 'EDIT',
      displayOrder: 1,
      id: 'stage/id',
      name: 'Editing',
    };

    expect(toTaskActionTarget(cell, stage)).toEqual({
      agreedPrice: '42.50',
      assigneeDiscordUserId: 'member/id',
      assigneeDisplayName: 'Editor',
      chapterId: 'chapter/id',
      currency: 'USD',
      id: 'task/id',
      paymentStatus: 'PENDING',
      stageCode: 'EDIT',
      stageName: 'Editing',
      status: 'READY',
      storyId: 'story/id',
    });
  });
});
