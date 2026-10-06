import { backendService } from '@/services';
import type { ApiProblems } from '@/types/api';
import formatError from '@/utils/formatError';

import type { Member, MemberRemovalResult } from '../types';

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

export async function removeMember(
  workspaceId: string,
  discordUserId: string,
): Promise<MemberRemovalResult> {
  const response = await backendService.delete<MemberRemovalResult>(
    `/api/users/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(discordUserId)}`,
  );
  if (response.kind === 'ok') return response.data;
  throwMemberApiError(response);
}

export async function retryMemberRevocation(
  workspaceId: string,
  discordUserId: string,
): Promise<MemberRemovalResult> {
  const response = await backendService.post<MemberRemovalResult>(
    `/api/users/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(discordUserId)}/revocation/retry`,
  );
  if (response.kind === 'ok') return response.data;
  throwMemberApiError(response);
}

export async function activateMember(
  workspaceId: string,
  discordUserId: string,
): Promise<Member> {
  const response = await backendService.post<Member>(
    `/api/users/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(discordUserId)}/reactivate`,
  );
  if (response.kind === 'ok') return response.data;
  throwMemberApiError(response);
}
