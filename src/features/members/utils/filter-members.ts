import type { Member, MemberStatus } from '../types';

export function filterMembers(
  members: readonly Member[],
  search: string,
  status: MemberStatus | 'ALL',
): Member[] {
  const normalizedSearch = search.trim().toLocaleLowerCase();

  return members.filter((member) => {
    if (status !== 'ALL' && member.status !== status) return false;
    if (!normalizedSearch) return true;

    const searchableText = [
      member.displayName,
      member.username,
      member.discordUserId,
      member.gmail,
      ...member.stages.flatMap((stage) => [stage.code, stage.name]),
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase();

    return searchableText.includes(normalizedSearch);
  });
}
