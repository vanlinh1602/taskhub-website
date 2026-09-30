import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { adminQueryKeys } from '@/features/admin/hooks';
import { chaptersQueryKeys } from '@/features/chapters/hooks';
import { tasksQueryKeys } from '@/features/tasks/hooks';

import {
  cancelPayrollBatch,
  createPayrollBatch,
  payPayrollBatchRecipient,
  recalculatePayrollRewards,
  updatePayrollBatchTaskPrice,
} from '../apis';
import type {
  PayrollBatchPaymentResult,
  PayrollBatchSummary,
  PayrollRewardRecalculationResult,
} from '../types';
import { payrollQueryKeys } from './queryKeys';

export async function invalidatePayrollQueries(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: payrollQueryKeys.listRoot() }),
    queryClient.invalidateQueries({ queryKey: payrollQueryKeys.detailRoot() }),
    queryClient.invalidateQueries({ queryKey: payrollQueryKeys.batchesRoot() }),
    queryClient.invalidateQueries({ queryKey: payrollQueryKeys.batchDetailRoot() }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboardRoot() }),
    queryClient.invalidateQueries({ queryKey: tasksQueryKeys.listRoot() }),
    queryClient.invalidateQueries({ queryKey: chaptersQueryKeys.detailRoot() }),
  ]);
}

export function useCreatePayrollBatchMutation(
  workspaceId: string,
): UseMutationResult<PayrollBatchSummary, Error, string, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cutoffAt: string) => createPayrollBatch(workspaceId, cutoffAt),
    onSuccess: async () => invalidatePayrollQueries(queryClient),
  });
}

export function usePayPayrollBatchRecipientMutation(
  workspaceId: string,
  batchId: string,
): UseMutationResult<PayrollBatchPaymentResult, Error, string, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (discordUserId: string) =>
      payPayrollBatchRecipient(workspaceId, batchId, discordUserId),
    onSuccess: async () => invalidatePayrollQueries(queryClient),
  });
}

export function useCancelPayrollBatchMutation(
  workspaceId: string,
): UseMutationResult<PayrollBatchSummary, Error, string, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => cancelPayrollBatch(workspaceId, batchId),
    onSuccess: async () => invalidatePayrollQueries(queryClient),
  });
}

export function useUpdatePayrollBatchTaskPriceMutation(
  workspaceId: string,
  batchId: string,
): UseMutationResult<
  { readonly taskId: string; readonly agreedPrice: string },
  Error,
  { readonly taskId: string; readonly agreedPrice: string },
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, agreedPrice }) =>
      updatePayrollBatchTaskPrice(workspaceId, batchId, taskId, agreedPrice),
    onSuccess: async () => invalidatePayrollQueries(queryClient),
  });
}

export function useRecalculatePayrollRewardsMutation(
  workspaceId: string,
): UseMutationResult<PayrollRewardRecalculationResult, Error, void, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => recalculatePayrollRewards(workspaceId),
    onSuccess: async () => {
      await invalidatePayrollQueries(queryClient);
    },
  });
}
