import { backendService } from '@/services';
import type { ApiProblems } from '@/types/api';
import formatError from '@/utils/formatError';

import type { Member } from '../types';

export class MembersForbiddenError extends Error {
  constructor() {
    super('Members access forbidden');
    this.name = 'MembersForbiddenError';
  }
}

function throwMemberApiError(response: ApiProblems): never {
  if (response.kind === 'forbidden') throw new MembersForbiddenError();
  throw new Error(formatError(response));
}

export async function getMembers(workspaceId: string): Promise<Member[]> {
  const response = await backendService.get<Member[]>(
    `/api/users/${encodeURIComponent(workspaceId)}/members`,
  );
  if (response.kind === 'ok') return response.data;
  throwMemberApiError(response);
}

export async function updateMemberTaskClaim(
  workspaceId: string,
  discordUserId: string,
  enabled: boolean,
): Promise<Member> {
  const response = await backendService.patch<Member>(
    `/api/users/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(discordUserId)}/task-claim`,
    { enabled },
  );
  if (response.kind === 'ok') return response.data;
  throwMemberApiError(response);
}
