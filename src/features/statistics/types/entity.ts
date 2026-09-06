export type StatisticsDateBasis = 'CREATED' | 'COMPLETED' | 'PAID';

export type StatisticsTaskStatus =
  | 'BLOCKED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type StatisticsPaymentStatus = 'NOT_READY' | 'PENDING' | 'PAID';

export interface StatisticsFilters {
  readonly from: string;
  readonly to: string;
  readonly dateBasis: StatisticsDateBasis;
  readonly storyId: string;
  readonly assigneeDiscordUserId: string;
  readonly workflowTemplateId: string;
  readonly stageDefinitionId: string;
  readonly status: StatisticsTaskStatus | '';
  readonly paymentStatus: StatisticsPaymentStatus | '';
  readonly page: number;
  readonly pageSize: number;
}

export type StatisticsSummaryFilters = Omit<StatisticsFilters, 'page' | 'pageSize'>;

export interface StatisticsStageColumn {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly displayOrder: number;
}

export interface StatisticsTaskCell {
  readonly taskId: string;
  readonly assigneeDiscordUserId: string | null;
  readonly assigneeDisplayName: string | null;
  readonly agreedPrice: string;
  readonly currency: string;
  readonly taskStatus: StatisticsTaskStatus;
  readonly paymentStatus: StatisticsPaymentStatus;
  readonly createdAt: string;
  readonly completedAt: string | null;
  readonly paidAt: string | null;
  readonly storyId: string;
  readonly chapterId: string;
  readonly stageDefinitionId: string;
}

export interface StatisticsChapterRow {
  readonly storyId: string;
  readonly storyTitle: string;
  readonly chapterId: string;
  readonly chapterName: string;
  readonly publicationStatus: 'PUBLISHED' | 'UNPUBLISHED';
  readonly publicationUrl: string | null;
  readonly stages: Readonly<Record<string, StatisticsTaskCell | null>>;
}

export interface StatisticsResult {
  readonly dateBasis: StatisticsDateBasis;
  readonly columns: readonly StatisticsStageColumn[];
  readonly items: readonly StatisticsChapterRow[];
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
}

export interface StatisticsFilterOptions {
  readonly stories: readonly { readonly id: string; readonly title: string }[];
  readonly workflows: readonly {
    readonly id: string;
    readonly name: string;
    readonly storyCount: number;
  }[];
  readonly stages: readonly StatisticsStageColumn[];
  readonly assignees: readonly {
    readonly id: string | null;
    readonly displayName: string;
  }[];
}

export interface StatisticsSummaryRow {
  readonly workflowId: string;
  readonly workflowName: string;
  readonly stageDefinitionId: string;
  readonly stageName: string;
  readonly displayOrder: number;
  readonly taskCount: number;
  readonly totalAgreedPrice: string;
  readonly currency: string;
}

export interface StatisticsSummaryTotal {
  readonly currency: string;
  readonly taskCount: number;
  readonly totalAgreedPrice: string;
}

export interface StatisticsSummaryResult {
  readonly rows: readonly StatisticsSummaryRow[];
  readonly totals: readonly StatisticsSummaryTotal[];
  readonly totalTaskCount: number;
}
