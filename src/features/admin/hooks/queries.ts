import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import { getDashboard, getWorkspaces } from '@/features/admin/apis';
import type { AdminDashboard, Workspace } from '@/features/admin/types';

import { adminQueryKeys } from './queryKeys';

interface WorkspacesQueryOptions {
  readonly queryKey: ReturnType<typeof adminQueryKeys.workspaces>;
  readonly queryFn: typeof getWorkspaces;
}

interface DashboardQueryOptions {
  readonly enabled: boolean;
  readonly queryFn: () => Promise<AdminDashboard>;
  readonly queryKey: ReturnType<typeof adminQueryKeys.dashboard>;
  readonly staleTime: number;
}

export function createWorkspacesQueryOptions(): WorkspacesQueryOptions {
  return {
    queryKey: adminQueryKeys.workspaces(),
    queryFn: getWorkspaces,
  };
}

export function createDashboardQueryOptions(
  workspaceId: string,
): DashboardQueryOptions {
  return {
    queryKey: adminQueryKeys.dashboard(workspaceId),
    queryFn: () => getDashboard(workspaceId),
    enabled: workspaceId.length > 0,
    staleTime: 60 * 1000,
  };
}

export function useWorkspacesQuery(): UseQueryResult<Workspace[], Error> {
  return useQuery(createWorkspacesQueryOptions());
}

export function useDashboardQuery(
  workspaceId: string,
): UseQueryResult<AdminDashboard, Error> {
  return useQuery(createDashboardQueryOptions(workspaceId));
}
