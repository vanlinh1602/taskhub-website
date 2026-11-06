import type { ChapterPriority } from '@/features/chapters/types';

export interface Story {
  readonly id: string;
  readonly title: string;
  readonly alternativeTitle: string | null;
  readonly status: string;
  readonly priority: ChapterPriority;
  readonly googleDriveUrl: string;
  readonly createdAt: string;
}

export interface CreateStoryInput {
  readonly title: string;
  readonly alternativeTitle?: string;
  readonly folderId?: string;
}

export interface UpdateStoryPriorityInput {
  readonly priority: ChapterPriority;
}

export interface RenameStoryInput {
  readonly title: string;
}
