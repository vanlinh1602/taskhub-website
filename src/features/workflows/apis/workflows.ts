import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import type {
  WorkflowTemplateConfiguration,
  WorkflowTemplatePage,
  WorkflowTemplateSavePayload,
  WorkflowTemplateStatus,
  WorkflowTemplateSummary,
} from '../types';

const MAX_PAGE_SIZE = 25;

function workflowTemplatesPath(workspaceId: string): string {
  return `/api/story-workflow/${encodeURIComponent(workspaceId)}/workflow-templates`;
}

function workflowTemplatePath(workspaceId: string, templateId: string): string {
  return `${workflowTemplatesPath(workspaceId)}/${encodeURIComponent(templateId)}`;
}

function throwApiError(response: {
  readonly kind: string;
  readonly [key: string]: unknown;
}): never {
  throw new Error(formatError(response));
}

export async function getWorkflowTemplates(
  workspaceId: string,
  statuses: readonly WorkflowTemplateStatus[],
  page = 0,
  pageSize = MAX_PAGE_SIZE,
): Promise<WorkflowTemplatePage> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(Math.min(pageSize, MAX_PAGE_SIZE)),
  });
  statuses.forEach((status) => params.append('status', status));
  const response = await backendService.get<WorkflowTemplatePage>(
    `${workflowTemplatesPath(workspaceId)}?${params.toString()}`,
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export async function getWorkflowTemplate(
  workspaceId: string,
  templateId: string,
): Promise<WorkflowTemplateConfiguration> {
  const response = await backendService.get<WorkflowTemplateConfiguration>(
    workflowTemplatePath(workspaceId, templateId),
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export async function createWorkflowTemplate(
  workspaceId: string,
  name: string,
): Promise<WorkflowTemplateSummary> {
  const response = await backendService.post<WorkflowTemplateSummary>(
    workflowTemplatesPath(workspaceId),
    { name },
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export async function saveWorkflowTemplate(
  workspaceId: string,
  templateId: string,
  payload: WorkflowTemplateSavePayload,
): Promise<WorkflowTemplateSummary> {
  const response = await backendService.put<WorkflowTemplateSummary>(
    workflowTemplatePath(workspaceId, templateId),
    payload,
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export async function publishWorkflowTemplate(
  workspaceId: string,
  templateId: string,
): Promise<null> {
  const response = await backendService.post<null>(
    `${workflowTemplatePath(workspaceId, templateId)}/publish`,
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export async function restoreWorkflowTemplate(
  workspaceId: string,
  templateId: string,
): Promise<null> {
  const response = await backendService.post<null>(
    `${workflowTemplatePath(workspaceId, templateId)}/restore`,
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export async function deactivateWorkflowTemplate(
  workspaceId: string,
  templateId: string,
): Promise<null> {
  const response = await backendService.post<null>(
    `${workflowTemplatePath(workspaceId, templateId)}/deactivate`,
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export async function deleteWorkflowTemplate(
  workspaceId: string,
  templateId: string,
): Promise<null> {
  const response = await backendService.delete<null>(
    workflowTemplatePath(workspaceId, templateId),
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export async function setDefaultWorkflowTemplate(
  workspaceId: string,
  templateId: string | null,
): Promise<null> {
  const response = await backendService.patch<null>(
    `${workflowTemplatesPath(workspaceId)}/default`,
    { templateId },
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}
