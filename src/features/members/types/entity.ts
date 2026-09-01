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

export interface Member {
  readonly discordUserId: string;
  readonly displayName: string;
  readonly username: string | null;
  readonly avatarUrl: string | null;
  readonly gmail: string | null;
  readonly status: MemberStatus;
  readonly joinedAt: string;
  readonly stages: readonly MemberStage[];
  readonly bankQr: MemberBankQr;
}
