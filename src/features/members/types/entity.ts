export type MemberStatus = 'ACTIVE' | 'SUSPENDED' | 'LEFT';

export interface MemberStage {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly isActive: boolean;
}

export interface MemberBankQr {
  readonly configured: boolean;
  readonly fileName: string | null;
}

export type MemberRevocationStatus = 'NOT_STARTED' | 'PENDING' | 'COMPLETE';

export interface MemberRemovalResult {
  readonly member: Member;
  readonly unassignedTaskCount: number;
  readonly payrollLockedTaskCount: number;
}

export interface Member {
  readonly discordUserId: string;
  readonly displayName: string;
  readonly username: string | null;
  readonly avatarUrl: string | null;
  readonly gmail: string | null;
  readonly status: MemberStatus;
  readonly revocationStatus?: MemberRevocationStatus;
  readonly pendingDiscordRoleCount?: number;
  readonly pendingDriveGrantCount?: number;
  readonly revocationError?: string | null;
  readonly joinedAt: string;
  readonly stages: readonly MemberStage[];
  readonly bankQr: MemberBankQr;
}
