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
