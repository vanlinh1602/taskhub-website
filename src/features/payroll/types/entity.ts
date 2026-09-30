export type PayrollStatus = 'PENDING' | 'PAID';

export interface PayrollTotals {
  readonly currency: string;
  readonly total: number;
}

export interface PayrollRewardBreakdown {
  readonly stageDefinitionId: string;
  readonly stageCode: string;
  readonly stageName: string;
  readonly eligibleTaskCount: number;
  readonly rewardRate: number | null;
  readonly rewardTotal: number;
  readonly nextThreshold: number | null;
}

export interface PayrollSummary {
  readonly taskCount: number;
  readonly baseTotals: readonly PayrollTotals[];
  readonly rewardEligibleTaskCount: number;
  readonly rewardRate: number | null;
  readonly nextThreshold: number | null;
  readonly rewardTotal: number;
  readonly rewardBreakdowns: readonly PayrollRewardBreakdown[];
  readonly grandTotals: readonly PayrollTotals[];
  readonly latestPaidAt: string | null;
}

export interface PayrollRecipient extends PayrollSummary {
  readonly discordUserId: string;
  readonly status: PayrollStatus;
  readonly displayName: string;
  readonly username: string | null;
  readonly avatarUrl: string | null;
}

export interface PayrollRecipientList {
  readonly items: readonly PayrollRecipient[];
  readonly summary: PayrollSummary;
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
}

export interface PayrollTask {
  readonly id: string;
  readonly storyId: string;
  readonly storyTitle: string;
  readonly chapterId: string;
  readonly chapterName: string;
  readonly stageDefinitionId: string;
  readonly stageCode: string;
  readonly stageName: string;
  readonly status: 'BLOCKED' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  readonly paymentStatus: PayrollStatus;
  readonly completedAt: string | null;
  readonly agreedPrice: string;
  readonly rewardAmount: string;
  readonly currency: string;
  readonly paidAt: string | null;
  readonly paidByDiscordUserId: string | null;
  readonly paymentReference: string | null;
}

export interface PayrollBankQr {
  readonly configured: boolean;
  readonly fileName: string | null;
}

export interface PayrollRecipientDetail {
  readonly recipient: PayrollRecipient;
  readonly bankQr: PayrollBankQr;
  readonly tasks: readonly PayrollTask[];
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
}

export interface PayrollListQuery {
  readonly status: PayrollStatus;
  readonly page: number;
  readonly pageSize: number;
  readonly from?: string;
  readonly to?: string;
}

export interface PayrollPaymentResult {
  readonly taskCount: number;
  readonly baseTotals: readonly PayrollTotals[];
  readonly rewardEligibleTaskCount: number;
  readonly rewardRate: number | null;
  readonly rewardTotal: number;
  readonly rewardBreakdowns: readonly PayrollRewardBreakdown[];
  readonly grandTotals: readonly PayrollTotals[];
}

export interface PayrollRewardRecalculationResult {
  readonly processedTaskCount: number;
  readonly updatedTaskCount: number;
  readonly recipientCount: number;
  readonly rewardTotal: number;
}

export type PayrollBatchStatus =
  | 'OPEN'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'CANCELLED';

export interface PayrollBatchSummary {
  readonly id: string;
  readonly cutoffAt: string;
  readonly createdAt: string;
  readonly createdByDiscordUserId: string;
  readonly status: PayrollBatchStatus;
  readonly taskCount: number;
  readonly recipientCount: number;
  readonly paidRecipientCount: number;
  readonly baseTotals: readonly PayrollTotals[];
  readonly rewardTotal: number;
  readonly grandTotals: readonly PayrollTotals[];
  readonly paidAt: string | null;
  readonly cancelledAt: string | null;
}

export interface PayrollBatchRecipient {
  readonly discordUserId: string;
  readonly displayName: string;
  readonly username: string | null;
  readonly avatarUrl: string | null;
  readonly taskCount: number;
  readonly baseTotals: readonly PayrollTotals[];
  readonly rewardTotal: number;
  readonly grandTotals: readonly PayrollTotals[];
  readonly status: 'PENDING' | 'PAID';
  readonly paidAt: string | null;
}

export interface PayrollBatchTask extends PayrollTask {
  readonly recipientDiscordUserId: string;
}

export interface PayrollBatchDetail extends PayrollBatchSummary {
  readonly recipients: readonly PayrollBatchRecipient[];
  readonly tasks: readonly PayrollBatchTask[];
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
}

export interface PayrollBatchDetailQuery {
  readonly recipientDiscordUserId?: string;
  readonly page: number;
  readonly pageSize: number;
}

export interface PayrollBatchPaymentResult extends PayrollPaymentResult {
  readonly batchId: string;
}
