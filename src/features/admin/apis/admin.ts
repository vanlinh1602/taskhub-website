import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import type { AdminDashboard, Workspace } from '../types';

function createQuery(parameters: Record<string, string>): string {
  return new URLSearchParams(parameters).toString();
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await backendService.get<Workspace[]>('/api/workspace');
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function getDashboard(
  workspaceId: string,
): Promise<AdminDashboard> {
  const to = new Date();
  const from = new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
  const query = createQuery({
    workspaceId,
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const response = await backendService.get<AdminDashboard>(
    `/api/story-workflow/dashboard?${query}`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}
