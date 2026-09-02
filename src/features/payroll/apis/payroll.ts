import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import type {
  PayrollListQuery,
  PayrollPaymentResult,
  PayrollRecipientDetail,
  PayrollRecipientList,
} from '../types';

function createPayrollQuery(query: PayrollListQuery): string {
  return new URLSearchParams({
    status: query.status,
    page: String(query.page),
    pageSize: String(query.pageSize),
  }).toString();
}

function createPayrollPath(workspaceId: string, suffix: string): string {
  return `/api/story-workflow/${encodeURIComponent(workspaceId)}/payroll${suffix}`;
}

export async function getPayrollRecipients(
  workspaceId: string,
  query: PayrollListQuery,
): Promise<PayrollRecipientList> {
  const response = await backendService.get<PayrollRecipientList>(
    `${createPayrollPath(workspaceId, '/recipients')}?${createPayrollQuery(query)}`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function getPayrollRecipient(
  workspaceId: string,
  discordUserId: string,
  query: PayrollListQuery,
): Promise<PayrollRecipientDetail> {
  const response = await backendService.get<PayrollRecipientDetail>(
    `${createPayrollPath(workspaceId, `/recipients/${encodeURIComponent(discordUserId)}`)}?${createPayrollQuery(query)}`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function getPayrollBankQr(
  workspaceId: string,
  discordUserId: string,
): Promise<Blob> {
  const response = await backendService.getBlob(
    createPayrollPath(
      workspaceId,
      `/recipients/${encodeURIComponent(discordUserId)}/bank-qr`,
    ),
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function payPayrollRecipient(
  workspaceId: string,
  discordUserId: string,
): Promise<PayrollPaymentResult> {
  const response = await backendService.post<PayrollPaymentResult>(
    createPayrollPath(
      workspaceId,
      `/recipients/${encodeURIComponent(discordUserId)}/pay`,
    ),
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}
