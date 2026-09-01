export type DeadlineExtensionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type DeadlineExtensionStatusFilter = DeadlineExtensionStatus | 'ALL';

export interface DeadlineExtensionRequest {
  readonly id: string;
  readonly taskId: string;
  readonly requesterDiscordUserId: string;
  readonly requesterDisplayName: string | null;
  readonly storyId: string;
  readonly storyTitle: string;
  readonly chapterId: string;
  readonly chapterName: string;
  readonly stageDefinitionId: string;
  readonly stageCode: string;
  readonly stageName: string;
  readonly requestedHours: number;
  readonly status: DeadlineExtensionStatus;
  readonly dueAt: string | null;
  readonly projectedDueAt: string | null;
  readonly reviewerDiscordUserId: string | null;
  readonly reviewerDisplayName: string | null;
  readonly reviewedAt: string | null;
  readonly rejectionReason: string | null;
  readonly createdAt: string;
}

export interface DeadlineExtensionListPage {
  readonly items: readonly DeadlineExtensionRequest[];
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
}

export interface DeadlineExtensionListQuery {
  readonly status: DeadlineExtensionStatusFilter;
  readonly search: string;
  readonly page: number;
  readonly pageSize: number;
}
