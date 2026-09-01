import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createWorkflowTemplate,
  deactivateWorkflowTemplate,
  deleteWorkflowTemplate,
  publishWorkflowTemplate,
  restoreWorkflowTemplate,
  saveWorkflowTemplate,
  setDefaultWorkflowTemplate,
} from '../apis';
import type {
  WorkflowTemplateSavePayload,
  WorkflowTemplateSummary,
} from '../types';
import { workflowQueryKeys } from './queryKeys';

export async function invalidateWorkflowQueries(
  queryClient: QueryClient,
  workspaceId: string,
  templateId?: string,
): Promise<void> {
  const keys = [
    queryClient.invalidateQueries({
      queryKey: workflowQueryKeys.all(workspaceId),
    }),
  ];
  if (templateId) {
    keys.push(
      queryClient.invalidateQueries({
        queryKey: workflowQueryKeys.detail(workspaceId, templateId),
      }),
    );
  }
  await Promise.all(keys);
}

export function useCreateWorkflowMutation(
  workspaceId: string,
): UseMutationResult<WorkflowTemplateSummary, Error, string, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name) => createWorkflowTemplate(workspaceId, name),
    onSuccess: () => invalidateWorkflowQueries(queryClient, workspaceId),
  });
}

export interface SaveWorkflowInput {
  readonly templateId: string;
  readonly payload: WorkflowTemplateSavePayload;
}

export function useSaveWorkflowMutation(
  workspaceId: string,
): UseMutationResult<
  WorkflowTemplateSummary,
  Error,
  SaveWorkflowInput,
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, payload }) =>
      saveWorkflowTemplate(workspaceId, templateId, payload),
    onSuccess: (template) =>
      invalidateWorkflowQueries(queryClient, workspaceId, template.id),
  });
}

export interface WorkflowTemplateActionInput {
  readonly templateId: string;
}

function useActionMutation(
  workspaceId: string,
  action: (workspaceId: string, templateId: string) => Promise<null>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId }: WorkflowTemplateActionInput) =>
      action(workspaceId, templateId),
    onSuccess: (_, { templateId }) =>
      invalidateWorkflowQueries(queryClient, workspaceId, templateId),
  });
}

export function usePublishWorkflowMutation(workspaceId: string) {
  return useActionMutation(workspaceId, publishWorkflowTemplate);
}

export function useRestoreWorkflowMutation(workspaceId: string) {
  return useActionMutation(workspaceId, restoreWorkflowTemplate);
}

export function useDeactivateWorkflowMutation(workspaceId: string) {
  return useActionMutation(workspaceId, deactivateWorkflowTemplate);
}

export function useDeleteWorkflowMutation(workspaceId: string) {
  return useActionMutation(workspaceId, deleteWorkflowTemplate);
}

export function useSetDefaultWorkflowMutation(
  workspaceId: string,
): UseMutationResult<null, Error, string | null, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId) =>
      setDefaultWorkflowTemplate(workspaceId, templateId),
    onSuccess: () => invalidateWorkflowQueries(queryClient, workspaceId),
  });
}
