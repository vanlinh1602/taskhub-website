import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import type {
  PayrollBatchDetail,
  PayrollBatchDetailQuery,
  PayrollBatchPaymentResult,
  PayrollBatchSummary,
} from '../types';

type PayrollBatchSummaryApiResponse = Omit<PayrollBatchSummary, 'id'> & {
  readonly id: number | string;
};

type PayrollBatchDetailApiResponse = Omit<PayrollBatchDetail, 'id'> & {
  readonly id: number | string;
};

function createPayrollBatchPath(workspaceId: string, suffix = ''): string {
  return `/api/story-workflow/${encodeURIComponent(workspaceId)}/payroll/batches${suffix}`;
}

function normalizePayrollBatchSummary(
  batch: PayrollBatchSummaryApiResponse,
): PayrollBatchSummary {
  return { ...batch, id: String(batch.id) };
}

function normalizePayrollBatchDetail(
  batch: PayrollBatchDetailApiResponse,
): PayrollBatchDetail {
  return { ...batch, id: String(batch.id) };
}

export async function getPayrollBatches(
  workspaceId: string,
): Promise<readonly PayrollBatchSummary[]> {
  const response = await backendService.get<
    readonly PayrollBatchSummaryApiResponse[]
  >(createPayrollBatchPath(workspaceId));
  if (response.kind === 'ok')
    return response.data.map(normalizePayrollBatchSummary);
  throw new Error(formatError(response));
}

export async function getPayrollBatch(
  workspaceId: string,
  batchId: string,
  query: PayrollBatchDetailQuery,
): Promise<PayrollBatchDetail> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.recipientDiscordUserId)
    params.set('recipientDiscordUserId', query.recipientDiscordUserId);
  const response = await backendService.get<PayrollBatchDetailApiResponse>(
    `${createPayrollBatchPath(workspaceId, `/${encodeURIComponent(batchId)}`)}?${params.toString()}`,
  );
  if (response.kind === 'ok') return normalizePayrollBatchDetail(response.data);
  throw new Error(formatError(response));
}

export async function createPayrollBatch(
  workspaceId: string,
  cutoffAt: string,
): Promise<PayrollBatchSummary> {
  const response = await backendService.post<PayrollBatchSummaryApiResponse>(
    createPayrollBatchPath(workspaceId),
    { cutoffAt },
  );
  if (response.kind === 'ok')
    return normalizePayrollBatchSummary(response.data);
  throw new Error(formatError(response));
}

export async function payPayrollBatchRecipient(
  workspaceId: string,
  batchId: string,
  discordUserId: string,
): Promise<PayrollBatchPaymentResult> {
  const response = await backendService.post<PayrollBatchPaymentResult>(
    createPayrollBatchPath(
      workspaceId,
      `/${encodeURIComponent(batchId)}/recipients/${encodeURIComponent(discordUserId)}/pay`,
    ),
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function cancelPayrollBatch(
  workspaceId: string,
  batchId: string,
): Promise<PayrollBatchSummary> {
  const response = await backendService.post<PayrollBatchSummaryApiResponse>(
    createPayrollBatchPath(
      workspaceId,
      `/${encodeURIComponent(batchId)}/cancel`,
    ),
  );
  if (response.kind === 'ok')
    return normalizePayrollBatchSummary(response.data);
  throw new Error(formatError(response));
}

export async function updatePayrollBatchTaskPrice(
  workspaceId: string,
  batchId: string,
  taskId: string,
  agreedPrice: string,
): Promise<{ readonly taskId: string; readonly agreedPrice: string }> {
  const response = await backendService.patch<{
    readonly taskId: string;
    readonly agreedPrice: string;
  }>(
    createPayrollBatchPath(
      workspaceId,
      `/${encodeURIComponent(batchId)}/tasks/${encodeURIComponent(taskId)}/price`,
    ),
    { agreedPrice },
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}
