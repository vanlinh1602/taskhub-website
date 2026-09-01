export type ChapterPriority = 'LOW' | 'NORMAL' | 'HIGH';

export type ChapterDifficulty = 'NORMAL' | 'HARD' | 'VERY_HARD';

export type ChapterWorkflowStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export type ChapterWorkflowFilter = ChapterWorkflowStatus | 'ALL';

export type ChapterTaskStatus =
  | 'BLOCKED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ChapterManagerTaskStatus = Extract<
  ChapterTaskStatus,
  'BLOCKED' | 'READY' | 'CANCELLED'
>;

export type ChapterPaymentStatus = 'NOT_READY' | 'PENDING' | 'PAID';

export interface Chapter {
  readonly id: string;
  readonly chapterName: string;
  readonly difficulty: ChapterDifficulty;
  readonly priority: ChapterPriority;
  readonly hasAdultContent: boolean;
  readonly googleDriveUrl: string | null;
  readonly workflowStatus: ChapterWorkflowStatus | null;
  readonly publicationStatus: 'PUBLISHED' | 'UNPUBLISHED';
  readonly publicationUrl: string | null;
  readonly completedTasks: number;
  readonly totalTasks: number;
}

export interface ChapterPage {
  readonly items: readonly Chapter[];
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
}

export interface ChapterAssignee {
  readonly discordUserId: string;
  readonly displayName: string | null;
}

export interface ChapterWorkflowSummary {
  readonly id: string;
  readonly name: string;
  readonly status: ChapterWorkflowStatus;
  readonly note: string | null;
  readonly createdAt: string;
  readonly activatedAt: string | null;
  readonly completedAt: string | null;
}

export interface ChapterTask {
  readonly id: string;
  readonly stageCode: string;
  readonly stageName: string;
  readonly status: ChapterTaskStatus;
  readonly paymentStatus: ChapterPaymentStatus;
  readonly assignee: ChapterAssignee | null;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly dueAt: string | null;
  readonly completedAt: string | null;
  readonly agreedPrice: string | null;
  readonly rewardAmount: string | null;
  readonly currency: string;
  readonly paidAt: string | null;
}

export interface ChapterDetail {
  readonly chapter: Chapter;
  readonly chapterWorkflow: ChapterWorkflowSummary | null;
  readonly tasks: readonly ChapterTask[];
}

export interface CreateChapterInput {
  readonly folderId: string;
  readonly priority?: ChapterPriority;
}

export interface UpdateChapterConfigurationInput {
  readonly difficulty?: ChapterDifficulty;
  readonly hasAdultContent?: boolean;
  readonly priority?: ChapterPriority;
}

export interface UpdateChapterTaskInput {
  readonly status?: ChapterManagerTaskStatus;
  readonly agreedPrice?: string;
  readonly assigneeDiscordUserId?: string | null;
}
