export type TaskStatus =
  | 'BLOCKED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskManagerTaskStatus = Extract<
  TaskStatus,
  'BLOCKED' | 'READY' | 'CANCELLED'
>;

export type PaymentStatus = 'NOT_READY' | 'PENDING' | 'PAID';

export type TaskSortBy =
  | 'DEADLINE'
  | 'STORY_TITLE'
  | 'CHAPTER_NAME'
  | 'CHAPTER_ID';

export type TaskSortOrder = 'ASC' | 'DESC';

export interface TaskAssignee {
  readonly discordUserId: string;
  readonly displayName: string | null;
}

export interface TaskActionTarget {
  readonly id: string;
  readonly storyId: string;
  readonly chapterId: string;
  readonly stageCode: string;
  readonly stageName: string;
  readonly status: TaskStatus;
  readonly paymentStatus: PaymentStatus;
  readonly agreedPrice: string | null;
  readonly currency: string;
  readonly assigneeDiscordUserId: string | null;
  readonly assigneeDisplayName: string | null;
}

export interface UpdateTaskInput {
  readonly status?: TaskManagerTaskStatus;
  readonly agreedPrice?: string;
  readonly assigneeDiscordUserId?: string | null;
}

export interface DeductTaskInput {
  readonly amount: string;
  readonly reason: string;
  readonly evidenceUrl?: string;
}

export interface TaskListItem {
  readonly id: string;
  readonly storyId: string;
  readonly storyTitle: string;
  readonly chapterId: string;
  readonly chapterName: string;
  readonly stageDefinitionId: string;
  readonly stageCode: string;
  readonly stageName: string;
  readonly status: TaskStatus;
  readonly dueAt: string | null;
  readonly assigneeDiscordUserId: string | null;
  readonly assigneeDisplayName: string | null;
  readonly paymentStatus: PaymentStatus;
  readonly agreedPrice: string;
  readonly currency: string;
}

export interface TaskListPage {
  readonly items: readonly TaskListItem[];
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
}

export interface TaskListQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly status?: TaskStatus;
  readonly storyId?: string;
  readonly stageDefinitionId?: string;
  readonly sortBy: TaskSortBy;
  readonly sortOrder: TaskSortOrder;
}

export interface TaskFilterStory {
  readonly id: string;
  readonly title: string;
  readonly isArchived: boolean;
}

export interface TaskFilterStage {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly isActive: boolean;
}

export interface TaskFilterOptions {
  readonly stories: readonly TaskFilterStory[];
  readonly stages: readonly TaskFilterStage[];
}
