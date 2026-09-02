import type { Member } from '@/features/members/types';
import { filterTaskAssignees as filterTaskAssigneesForTask } from '@/features/tasks/utils/filter-task-assignees';

import type { ChapterAssignee, ChapterTask } from '../types';

export function filterTaskAssignees(
  members: readonly Member[],
  task: Pick<ChapterTask, 'stageCode'> | null,
): ChapterAssignee[] {
  return filterTaskAssigneesForTask(members, task);
}
