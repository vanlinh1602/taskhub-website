import type { TaskActionTarget } from '@/features/tasks/types';

import type {
  StatisticsStageColumn,
  StatisticsTaskCell,
} from '../types';

export function toTaskActionTarget(
  cell: StatisticsTaskCell,
  stage: StatisticsStageColumn,
): TaskActionTarget {
  return {
    agreedPrice: cell.agreedPrice,
    assigneeDiscordUserId: cell.assigneeDiscordUserId,
    assigneeDisplayName: cell.assigneeDisplayName,
    chapterId: cell.chapterId,
    currency: cell.currency,
    dueAt: cell.dueAt,
    id: cell.taskId,
    paymentStatus: cell.paymentStatus,
    stageCode: stage.code,
    stageName: stage.name,
    status: cell.taskStatus,
    storyId: cell.storyId,
  };
}
