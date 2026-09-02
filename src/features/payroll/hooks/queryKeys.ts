import type { PayrollListQuery } from '../types';

export const payrollQueryKeys = {
  detail: (
    workspaceId: string,
    discordUserId: string,
    query: PayrollListQuery,
  ) => ['payroll', 'detail', workspaceId, discordUserId, query] as const,
  detailRoot: () => ['payroll', 'detail'] as const,
  bankQr: (workspaceId: string, discordUserId: string) =>
    ['payroll', 'bank-qr', workspaceId, discordUserId] as const,
  list: (workspaceId: string, query: PayrollListQuery) =>
    ['payroll', 'list', workspaceId, query] as const,
  listRoot: () => ['payroll', 'list'] as const,
};
