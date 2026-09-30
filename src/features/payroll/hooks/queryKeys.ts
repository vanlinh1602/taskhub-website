import type { PayrollBatchDetailQuery, PayrollListQuery } from '../types';

export const payrollQueryKeys = {
  detail: (
    workspaceId: string,
    discordUserId: string,
    query: PayrollListQuery,
  ) => ['payroll', 'detail', workspaceId, discordUserId, query] as const,
  detailRoot: () => ['payroll', 'detail'] as const,
  batchDetail: (
    workspaceId: string,
    batchId: string,
    query: PayrollBatchDetailQuery,
  ) => ['payroll', 'batch-detail', workspaceId, batchId, query] as const,
  batchDetailRoot: () => ['payroll', 'batch-detail'] as const,
  batches: (workspaceId: string) => ['payroll', 'batches', workspaceId] as const,
  batchesRoot: () => ['payroll', 'batches'] as const,
  bankQr: (workspaceId: string, discordUserId: string) =>
    ['payroll', 'bank-qr', workspaceId, discordUserId] as const,
  list: (workspaceId: string, query: PayrollListQuery) =>
    ['payroll', 'list', workspaceId, query] as const,
  listRoot: () => ['payroll', 'list'] as const,
};
