export type ChapterPriority = 'LOW' | 'NORMAL' | 'HIGH';

export type ChapterWorkflowStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export type ChapterWorkflowFilter = ChapterWorkflowStatus | 'ALL';

export interface Chapter {
  readonly id: string;
  readonly chapterName: string;
  readonly difficulty: string;
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

export interface CreateChapterInput {
  readonly folderId: string;
  readonly priority?: ChapterPriority;
}

export interface UpdateChapterConfigurationInput {
  readonly difficulty?: string;
  readonly hasAdultContent?: boolean;
  readonly priority?: ChapterPriority;
}
