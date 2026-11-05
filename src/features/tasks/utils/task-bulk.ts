import type { Member } from '@/features/members/types';

import type { TaskListItem, TaskManagerTaskStatus } from '../types';
import { canCompleteTask } from './task-state';

export type TaskBulkMode = 'assign' | 'complete' | 'deadline' | 'status';

export const BULK_UNASSIGN_VALUE = '__UNASSIGN__';

/** Mirrors the backend limit on task ids per bulk request. */
export const MAX_BULK_TASK_COUNT = 50;

type TaskForBulk = Pick<
  TaskListItem,
  'assigneeDiscordUserId' | 'dueAt' | 'paymentStatus' | 'stageCode' | 'status'
>;

export function isMemberEligibleForStage(
  member: Member,
  stageCode: string,
): boolean {
  return (
    member.status === 'ACTIVE' &&
    member.gmail !== null &&
    member.stages.some((stage) => stage.isActive && stage.code === stageCode)
  );
}

/** `assigneeId === null` means unassigning the task. */
export function canBulkAssignTask(
  task: TaskForBulk,
  assigneeId: string | null,
  members: readonly Member[],
): boolean {
  if (task.paymentStatus === 'PAID') return false;
  if (task.status !== 'READY' && task.status !== 'IN_PROGRESS') return false;
  if (assigneeId === null) return task.assigneeDiscordUserId !== null;
  if (task.assigneeDiscordUserId === assigneeId) return false;

  const member = members.find((item) => item.discordUserId === assigneeId);
  return (
    member !== undefined && isMemberEligibleForStage(member, task.stageCode)
  );
}

export function canBulkChangeDeadline(task: TaskForBulk): boolean {
  return task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
}

export function canBulkChangeStatus(
  task: TaskForBulk,
  nextStatus: TaskManagerTaskStatus,
): boolean {
  return task.paymentStatus !== 'PAID' && task.status !== nextStatus;
}

export function getBulkCompletableTasks<T extends TaskForBulk>(
  tasks: readonly T[],
): T[] {
  return tasks.filter(
    (task) => canCompleteTask(task) && task.paymentStatus !== 'PAID',
  );
}
