import type { TaskActionTarget, TaskListItem } from '../types';

export function toTaskActionTarget(task: TaskListItem): TaskActionTarget {
  return {
    agreedPrice: task.agreedPrice,
    assigneeDiscordUserId: task.assigneeDiscordUserId,
    assigneeDisplayName: task.assigneeDisplayName,
    chapterId: task.chapterId,
    currency: task.currency,
    dueAt: task.dueAt,
    id: task.id,
    paymentStatus: task.paymentStatus,
    stageCode: task.stageCode,
    stageName: task.stageName,
    status: task.status,
    storyId: task.storyId,
  };
}
