export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly timezone: string;
  readonly currency: string;
}

export interface AdminDashboard {
  readonly attention: {
    readonly blockedTasks: number;
    readonly overdueTasks: number;
    readonly pendingExtensions: number;
    readonly pendingPayments: number;
    readonly readyToPublish: number;
  };
  readonly actionItems: readonly DashboardActionItem[];
  readonly progress: readonly {
    readonly date: string;
    readonly completed: number;
  }[];
  readonly stages: readonly {
    readonly name: string;
    readonly total: number;
    readonly completed: number;
  }[];
}

export type DashboardActionType =
  | 'OVERDUE_TASK'
  | 'BLOCKED_TASK'
  | 'PENDING_EXTENSION'
  | 'PENDING_PAYMENT'
  | 'READY_TO_PUBLISH';

export interface DashboardActionItem {
  readonly id: string;
  readonly type: DashboardActionType;
  readonly storyId: string;
  readonly storyTitle: string;
  readonly chapterId: string;
  readonly chapterName: string;
  readonly stageName: string | null;
  readonly dueAt: string | null;
  readonly createdAt: string;
  readonly requestedHours: number | null;
}
