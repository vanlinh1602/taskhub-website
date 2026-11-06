import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getAllStages } from '@/features/stages/apis';
import type { Stage } from '@/features/stages/types';

import { getWorkflowTemplate, getWorkflowTemplates } from '../apis';
import type {
  WorkflowTemplateConfiguration,
  WorkflowTemplatePage,
  WorkflowTemplateStatus,
} from '../types';
import { workflowQueryKeys } from './queryKeys';

const PAGE_SIZE = 25;
const ALL_STATUSES: readonly WorkflowTemplateStatus[] = [
  'DRAFT',
  'ACTIVE',
  'INACTIVE',
];

export function useWorkflowTemplatesQuery(
  workspaceId: string,
  statuses: readonly WorkflowTemplateStatus[] = ALL_STATUSES,
  page = 0,
  search = '',
): UseQueryResult<WorkflowTemplatePage, Error> {
  return useQuery({
    queryKey: workflowQueryKeys.list(workspaceId, statuses, page, PAGE_SIZE, search),
    queryFn: () => getWorkflowTemplates(workspaceId, statuses, page, PAGE_SIZE, search),
    enabled: workspaceId.length > 0,
    placeholderData: (previousData) => previousData,
  });
}

export function useWorkflowTemplateQuery(
  workspaceId: string,
  templateId: string,
): UseQueryResult<WorkflowTemplateConfiguration, Error> {
  return useQuery({
    queryKey: workflowQueryKeys.detail(workspaceId, templateId),
    queryFn: () => getWorkflowTemplate(workspaceId, templateId),
    enabled: workspaceId.length > 0 && templateId.length > 0,
  });
}

export function useWorkflowStageCatalogQuery(
  workspaceId: string,
): UseQueryResult<readonly Stage[], Error> {
  return useQuery({
    queryKey: workflowQueryKeys.stageCatalog(workspaceId),
    queryFn: () => getAllStages(workspaceId),
    enabled: workspaceId.length > 0,
  });
}
