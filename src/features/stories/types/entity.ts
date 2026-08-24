export interface Story {
  readonly id: string;
  readonly title: string;
  readonly alternativeTitle: string | null;
  readonly status: string;
  readonly googleDriveUrl: string;
  readonly createdAt: string;
}

export interface CreateStoryInput {
  readonly title: string;
  readonly alternativeTitle?: string;
  readonly folderId?: string;
}
