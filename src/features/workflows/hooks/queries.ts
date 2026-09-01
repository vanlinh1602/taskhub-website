import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getStages } from '@/features/stages/apis';
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
): UseQueryResult<WorkflowTemplatePage, Error> {
  return useQuery({
    queryKey: workflowQueryKeys.list(workspaceId, statuses, page, PAGE_SIZE),
    queryFn: () => getWorkflowTemplates(workspaceId, statuses, page, PAGE_SIZE),
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
    queryFn: async () => {
      const firstPage = await getStages(workspaceId, 0, PAGE_SIZE);
      if (firstPage.pageCount <= 1) return firstPage.items;
      const remainingPages = await Promise.all(
        Array.from({ length: firstPage.pageCount - 1 }, (_, index) =>
          getStages(workspaceId, index + 1, PAGE_SIZE),
        ),
      );
      return [
        ...firstPage.items,
        ...remainingPages.flatMap((page) => page.items),
      ];
    },
    enabled: workspaceId.length > 0,
  });
}
