import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import type {
  DeadlineExtensionListPage,
  DeadlineExtensionListQuery,
  DeadlineExtensionRequest,
} from '../types';

function createListQuery(query: DeadlineExtensionListQuery): string {
  const parameters = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    status: query.status,
  });
  if (query.search.trim()) parameters.set('search', query.search.trim());
  return parameters.toString();
}

export async function getDeadlineExtensions(
  workspaceId: string,
  query: DeadlineExtensionListQuery,
): Promise<DeadlineExtensionListPage> {
  const response = await backendService.get<DeadlineExtensionListPage>(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/deadline-extensions?${createListQuery(query)}`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function approveDeadlineExtension(
  workspaceId: string,
  requestId: string,
): Promise<DeadlineExtensionRequest> {
  const response = await backendService.post<DeadlineExtensionRequest>(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/deadline-extensions/${encodeURIComponent(requestId)}/approve`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function rejectDeadlineExtension(
  workspaceId: string,
  requestId: string,
  reason: string,
): Promise<DeadlineExtensionRequest> {
  const response = await backendService.post<DeadlineExtensionRequest>(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/deadline-extensions/${encodeURIComponent(requestId)}/reject`,
    { reason: reason.trim() || undefined },
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}
