import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { adminQueryKeys } from '@/features/admin/hooks';
import { chaptersQueryKeys } from '@/features/chapters/hooks';
import { tasksQueryKeys } from '@/features/tasks/hooks';

import { payPayrollRecipient } from '../apis';
import type { PayrollPaymentResult } from '../types';
import { payrollQueryKeys } from './queryKeys';

export async function invalidatePayrollQueries(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: payrollQueryKeys.listRoot() }),
    queryClient.invalidateQueries({ queryKey: payrollQueryKeys.detailRoot() }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboardRoot() }),
    queryClient.invalidateQueries({ queryKey: tasksQueryKeys.listRoot() }),
    queryClient.invalidateQueries({ queryKey: chaptersQueryKeys.detailRoot() }),
  ]);
}

export function usePayPayrollRecipientMutation(
  workspaceId: string,
): UseMutationResult<PayrollPaymentResult, Error, string, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (discordUserId: string) =>
      payPayrollRecipient(workspaceId, discordUserId),
    onSuccess: async () => {
      await invalidatePayrollQueries(queryClient);
    },
  });
}
