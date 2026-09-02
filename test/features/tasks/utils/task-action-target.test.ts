import { describe, expect, it } from 'vitest';

import type { TaskListItem } from '@/features/tasks/types';
import { toTaskActionTarget } from '@/features/tasks/utils/task-action-target';

describe('task list action target', () => {
  it('maps a task list row to the shared action target', () => {
    const task: TaskListItem = {
      agreedPrice: '20',
      assigneeDiscordUserId: null,
      assigneeDisplayName: null,
      chapterId: 'chapter-1',
      chapterName: 'Chapter 1',
      currency: 'VND',
      dueAt: null,
      id: 'task-1',
      paymentStatus: 'NOT_READY',
      stageCode: 'TRANSLATE',
      stageDefinitionId: 'stage-1',
      stageName: 'Translate',
      status: 'READY',
      storyId: 'story-1',
      storyTitle: 'Story',
    };

    expect(toTaskActionTarget(task)).toMatchObject({
      chapterId: 'chapter-1',
      id: 'task-1',
      stageCode: 'TRANSLATE',
      storyId: 'story-1',
    });
  });
});
