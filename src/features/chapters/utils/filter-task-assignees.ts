import type { Member } from '@/features/members/types';

import type { ChapterAssignee, ChapterTask } from '../types';

export function filterTaskAssignees(
  members: readonly Member[],
  task: Pick<ChapterTask, 'stageCode'> | null,
): ChapterAssignee[] {
  if (!task) return [];

  return members
    .filter(
      (member) =>
        member.status === 'ACTIVE' &&
        member.gmail !== null &&
        member.stages.some(
          (stage) => stage.isActive && stage.code === task.stageCode,
        ),
    )
    .map(({ discordUserId, displayName }) => ({
      discordUserId,
      displayName,
    }));
}
