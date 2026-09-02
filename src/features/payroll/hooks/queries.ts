import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import {
  getPayrollBankQr,
  getPayrollRecipient,
  getPayrollRecipients,
} from '@/features/payroll/apis';
import type {
  PayrollListQuery,
  PayrollRecipientDetail,
  PayrollRecipientList,
} from '@/features/payroll/types';

import { payrollQueryKeys } from './queryKeys';

const PAYROLL_STALE_TIME = 30000;

export function usePayrollRecipientsQuery(
  workspaceId: string,
  query: PayrollListQuery,
): UseQueryResult<PayrollRecipientList, Error> {
  return useQuery({
    enabled: workspaceId.length > 0,
    queryFn: () => getPayrollRecipients(workspaceId, query),
    queryKey: payrollQueryKeys.list(workspaceId, query),
    staleTime: PAYROLL_STALE_TIME,
  });
}

export function usePayrollRecipientQuery(
  workspaceId: string,
  discordUserId: string,
  query: PayrollListQuery,
): UseQueryResult<PayrollRecipientDetail, Error> {
  return useQuery({
    enabled: workspaceId.length > 0 && discordUserId.length > 0,
    queryFn: () => getPayrollRecipient(workspaceId, discordUserId, query),
    queryKey: payrollQueryKeys.detail(workspaceId, discordUserId, query),
    staleTime: PAYROLL_STALE_TIME,
  });
}

export function usePayrollBankQrQuery(
  workspaceId: string,
  discordUserId: string,
  enabled: boolean,
): UseQueryResult<Blob, Error> {
  return useQuery({
    enabled: enabled && workspaceId.length > 0 && discordUserId.length > 0,
    queryFn: () => getPayrollBankQr(workspaceId, discordUserId),
    queryKey: payrollQueryKeys.bankQr(workspaceId, discordUserId),
    staleTime: 10 * 60 * 1000,
  });
}
