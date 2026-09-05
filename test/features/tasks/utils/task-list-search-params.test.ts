import { describe, expect, it } from 'vitest';

import {
  createTaskListSearchParams,
  DEFAULT_TASK_LIST_VIEW,
  readTaskListView,
} from '@/features/tasks/utils';

describe('task list search params', () => {
  it('reads valid filters, sort state, and page from the URL', () => {
    const view = readTaskListView(
      new URLSearchParams(
        'status=IN_PROGRESS&storyId=story-1&stageDefinitionId=stage-1&sortBy=CHAPTER_NAME&sortOrder=DESC&page=3',
      ),
    );

    expect(view).toEqual({
      page: 3,
      sortBy: 'CHAPTER_NAME',
      sortOrder: 'DESC',
      stageDefinitionId: 'stage-1',
      status: 'IN_PROGRESS',
      storyId: 'story-1',
    });
  });

  it('falls back to defaults for invalid sort, status, and page values', () => {
    expect(
      readTaskListView(
        new URLSearchParams(
          'status=UNKNOWN&sortBy=UNKNOWN&sortOrder=SIDEWAYS&page=-1',
        ),
      ),
    ).toEqual(DEFAULT_TASK_LIST_VIEW);
  });

  it('serializes active view state while preserving unrelated parameters', () => {
    const searchParams = createTaskListSearchParams(
      {
        page: 2,
        sortBy: 'STORY_TITLE',
        sortOrder: 'DESC',
        stageDefinitionId: 'stage-1',
        status: 'COMPLETED',
        storyId: 'story-1',
      },
      new URLSearchParams('tab=tasks&sortBy=DEADLINE&page=0'),
    );

    expect(searchParams.toString()).toBe(
      'tab=tasks&status=COMPLETED&storyId=story-1&stageDefinitionId=stage-1&sortBy=STORY_TITLE&sortOrder=DESC&page=2',
    );
  });

  it('omits default view state from the URL', () => {
    expect(createTaskListSearchParams(DEFAULT_TASK_LIST_VIEW).toString()).toBe(
      '',
    );
  });
});
