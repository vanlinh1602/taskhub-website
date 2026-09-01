import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import type { Stage, StagePage, StagePayload } from '../types';

const MAX_PAGE_SIZE = 25;

function workspaceStagesPath(workspaceId: string): string {
  return `/api/story-workflow/${encodeURIComponent(workspaceId)}/stages`;
}

function throwApiError(response: {
  readonly kind: string;
  readonly [key: string]: unknown;
}): never {
  throw new Error(formatError(response));
}

export async function getStages(
  workspaceId: string,
  page: number,
  pageSize = MAX_PAGE_SIZE,
): Promise<StagePage> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(Math.min(pageSize, MAX_PAGE_SIZE)),
  });
  const response = await backendService.get<StagePage>(
    `${workspaceStagesPath(workspaceId)}?${params.toString()}`,
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export async function createStage(
  workspaceId: string,
  payload: StagePayload,
): Promise<Stage> {
  const response = await backendService.post<Stage>(
    workspaceStagesPath(workspaceId),
    payload,
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export async function updateStage(
  workspaceId: string,
  stageId: string,
  payload: StagePayload,
): Promise<Stage> {
  const response = await backendService.patch<Stage>(
    `${workspaceStagesPath(workspaceId)}/${encodeURIComponent(stageId)}`,
    payload,
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export async function updateStageStatus(
  workspaceId: string,
  stageId: string,
  isActive: boolean,
): Promise<Stage> {
  const response = await backendService.patch<Stage>(
    `${workspaceStagesPath(workspaceId)}/${encodeURIComponent(stageId)}/status`,
    { isActive },
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}
