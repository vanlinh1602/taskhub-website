import type { User } from '@/features/user/type';

export function getWorkspaceName(
  user: User | undefined,
  fallbackName: string,
): string {
  const activeTeamId = user?.permissions?.activeTeam;
  const activeTeam = user?.permissions?.teams?.find(
    (team) => team.teamId === activeTeamId,
  );

  return activeTeam?.name ?? fallbackName;
}
