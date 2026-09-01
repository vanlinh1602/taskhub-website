export type TaskStatus =
  | 'BLOCKED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'NOT_READY' | 'PENDING' | 'PAID';

export type TaskDueAtOrder = 'ASC' | 'DESC';

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
  readonly dueAtOrder: TaskDueAtOrder;
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
