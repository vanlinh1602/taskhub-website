import {
  CalendarDays,
  Check,
  CircleAlert,
  CreditCard,
  Layers3,
  Mail,
  MoreHorizontal,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  UserRound,
  UsersRound,
  UserX,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MembersForbiddenError,
} from '@/features/members/apis';
import {
  useActivateMemberMutation,
  useMembersQuery,
  useRemoveMemberMutation,
  useRetryMemberRevocationMutation,
  useUpdateMemberTaskClaimMutation,
} from '@/features/members/hooks';
import type { Member, MemberRemovalResult, MemberStatus } from '@/features/members/types';
import { filterMembers } from '@/features/members/utils';
import { usePayrollBankQrQuery } from '@/features/payroll/hooks';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

type StatusFilter = MemberStatus | 'ALL' | 'ATTENTION';

const MAX_VISIBLE_STAGES = 2;

interface PendingTaskClaimAction {
  readonly enabled: boolean;
  readonly member: Member;
}

interface PendingMemberRemoval {
  readonly member: Member;
}

function getStatusLabel(
  status: MemberStatus,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (status === 'ACTIVE') return t(translations.members.statusActive);
  if (status === 'SUSPENDED') return t(translations.members.statusSuspended);
  return t(translations.members.statusLeft);
}

function getStatusClassName(status: MemberStatus): string {
  if (status === 'ACTIVE') {
    return 'bg-primary/10 text-link';
  }
  if (status === 'SUSPENDED') {
    return 'bg-destructive/10 text-destructive';
  }
  return 'bg-muted text-muted-foreground';
}

function isForbiddenError(error: unknown): boolean {
  if (error instanceof MembersForbiddenError) return true;
  const message = formatError(error).toLocaleLowerCase();
  return (
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('quyền')
  );
}

function formatMemberDate(
  joinedAt: string,
  dateFormatter: Intl.DateTimeFormat,
): string {
  const date = new Date(joinedAt);
  return Number.isNaN(date.getTime()) ? joinedAt : dateFormatter.format(date);
}

function MemberAvatar({ member }: { readonly member: Member }) {
  const initial = member.displayName.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 font-semibold text-link">
      <span aria-hidden="true">{initial}</span>
      {member.avatarUrl ? (
        <img
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={(event) => event.currentTarget.classList.add('hidden')}
          src={member.avatarUrl}
        />
      ) : null}
    </div>
  );
}

function StatusPill({
  status,
  t,
}: {
  readonly status: MemberStatus;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClassName(status)}`}
    >
      {status === 'ACTIVE' ? (
        <Check aria-hidden="true" className="size-3.5" />
      ) : status === 'SUSPENDED' ? (
        <ShieldOff aria-hidden="true" className="size-3.5" />
      ) : (
        <UserRound aria-hidden="true" className="size-3.5" />
      )}
      {getStatusLabel(status, t)}
    </span>
  );
}

function StageList({
  member,
  emptyLabel,
  compact = false,
}: {
  readonly member: Member;
  readonly emptyLabel: string;
  readonly compact?: boolean;
}) {
  if (member.stages.length === 0) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {(compact ? member.stages.slice(0, MAX_VISIBLE_STAGES) : member.stages).map((stage) => (
        <span
          className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
          key={stage.id}
          title={stage.code}
        >
          {stage.name}
        </span>
      ))}
      {compact && member.stages.length > MAX_VISIBLE_STAGES ? (
        <span
          className="rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground"
          title={member.stages
            .slice(MAX_VISIBLE_STAGES)
            .map((stage) => stage.name)
            .join(', ')}
        >
          +{member.stages.length - MAX_VISIBLE_STAGES}
        </span>
      ) : null}
    </div>
  );
}

interface MemberActionProps {
  readonly member: Member;
  readonly onView: (member: Member) => void;
  readonly onViewQr: (member: Member) => void;
  readonly onRemove: (member: Member) => void;
  readonly onRetryRevocation: (member: Member) => void;
  readonly retrying: boolean;
  readonly retryDisabled: boolean;
  readonly t: ReturnType<typeof useTranslation>['t'];
}

function MemberStatusCell({
  member,
  t,
}: {
  readonly member: Member;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusPill status={member.status} t={t} />
      {member.revocationStatus === 'PENDING' ? (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive"
          title={member.revocationError ?? undefined}
        >
          <CircleAlert aria-hidden="true" className="size-3.5" />
          {t(translations.members.revocationStatus)}
        </span>
      ) : null}
    </div>
  );
}

function BankQrIndicator({
  member,
  onViewQr,
  t,
}: {
  readonly member: Member;
  readonly onViewQr: (member: Member) => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const configured = member.bankQr.configured;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm ${configured ? 'text-foreground' : 'text-muted-foreground'}`}
    >
      {configured ? null : (
        <>
          <CreditCard aria-hidden="true" className="size-4" />
          {t(translations.members.bankQrNotConfigured)}
        </>
      )}
      {configured ? (
        <Button
          className="h-7 px-2"
          onClick={(event) => {
            event.stopPropagation();
            onViewQr(member);
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          <QrCode aria-hidden="true" />
          {t(translations.members.viewBankQr)}
        </Button>
      ) : null}
    </span>
  );
}

function MemberActionsMenu({
  member,
  onView,
  onRemove,
  onRetryRevocation,
  retrying,
  retryDisabled,
  t,
}: MemberActionProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`${t(translations.members.moreActions)}: ${member.displayName}`}
          size="icon"
          variant="ghost"
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => onView(member)}>
          {t(translations.members.viewDetails)}
        </DropdownMenuItem>
        {member.revocationStatus === 'PENDING' ? (
          <DropdownMenuItem disabled={retryDisabled} onSelect={() => onRetryRevocation(member)}>
            <RefreshCw aria-hidden="true" className={retrying ? 'size-4 animate-spin' : 'size-4'} />
            {t(translations.members.retryRevocation)}
          </DropdownMenuItem>
        ) : null}
        {member.status !== 'LEFT' ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
              onSelect={() => onRemove(member)}
            >
              <UserX aria-hidden="true" className="size-4" />
              {t(translations.members.removeMember)}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MemberIdentity({
  member,
  emptyLabel,
  onView,
}: {
  readonly member: Member;
  readonly emptyLabel: string;
  readonly onView: (member: Member) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <MemberAvatar member={member} />
      <div className="min-w-0">
        <button
          className="block max-w-full truncate rounded text-left font-semibold hover:text-link focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          onClick={(event) => {
            event.stopPropagation();
            onView(member);
          }}
          type="button"
        >
          {member.displayName}
        </button>
        <p className="truncate text-xs text-muted-foreground">
          {member.gmail ?? member.username ?? emptyLabel}
        </p>
      </div>
    </div>
  );
}

function MemberRow(props: MemberActionProps & { readonly emptyLabel: string }) {
  const { member, emptyLabel, onView, onViewQr, t } = props;
  return (
    <TableRow
      className="cursor-pointer border-border/60 hover:bg-muted/30"
      onClick={() => onView(member)}
    >
      <TableCell className="max-w-72 px-4 py-3">
        <MemberIdentity emptyLabel={emptyLabel} member={member} onView={onView} />
      </TableCell>
      <TableCell className="px-4 py-3">
        <StageList compact emptyLabel={emptyLabel} member={member} />
      </TableCell>
      <TableCell className="px-4 py-3">
        <MemberStatusCell member={member} t={t} />
      </TableCell>
      <TableCell className="px-4 py-3">
        <BankQrIndicator member={member} onViewQr={onViewQr} t={t} />
      </TableCell>
      <TableCell
        className="w-12 px-4 py-3 text-right"
        onClick={(event) => event.stopPropagation()}
      >
        <MemberActionsMenu {...props} />
      </TableCell>
    </TableRow>
  );
}

function MemberCard(props: MemberActionProps & { readonly emptyLabel: string }) {
  const { member, emptyLabel, onView, onViewQr, t } = props;
  return (
    <article
      className="cursor-pointer rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:bg-muted/30"
      onClick={() => onView(member)}
    >
      <div className="flex items-start justify-between gap-2">
        <MemberIdentity emptyLabel={emptyLabel} member={member} onView={onView} />
        <div onClick={(event) => event.stopPropagation()}>
          <MemberActionsMenu {...props} />
        </div>
      </div>
      <div className="mt-3 space-y-3">
        <MemberStatusCell member={member} t={t} />
        <StageList compact emptyLabel={emptyLabel} member={member} />
        <BankQrIndicator member={member} onViewQr={onViewQr} t={t} />
      </div>
    </article>
  );
}

function SummaryFilter({
  label,
  count,
  active,
  tone = 'default',
  onClick,
}: {
  readonly label: string;
  readonly count: number;
  readonly active: boolean;
  readonly tone?: 'default' | 'warning';
  readonly onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`flex min-w-28 flex-1 flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
        active ? 'border-primary bg-primary/10' : 'border-border/70 bg-card hover:bg-muted/40'
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`text-2xl font-bold tabular-nums ${tone === 'warning' && count > 0 ? 'text-destructive' : ''}`}
      >
        {count}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </button>
  );
}

function LoadingMembers({ label }: { readonly label: string }) {
  return (
    <div aria-label={label} className="space-y-3" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton className="h-16 w-full" key={index} />
      ))}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  readonly icon: typeof Mail;
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-muted/30 p-3">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium break-words">{children}</div>
      </div>
    </div>
  );
}

function MemberDetails({
  member,
  workspaceId,
  dateFormatter,
  onTaskClaim,
  onRetryRevocation,
  onActivate,
  memberActionPending,
  taskClaimPending,
  t,
}: {
  readonly member: Member;
  readonly workspaceId: string;
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly onTaskClaim: (member: Member, enabled: boolean) => void;
  readonly onRetryRevocation: (member: Member) => void;
  readonly onActivate: (member: Member) => void;
  readonly memberActionPending: boolean;
  readonly taskClaimPending: boolean;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const taskClaimEnabled = member.status === 'ACTIVE';
  const showRevocation = member.status === 'LEFT' || Boolean(member.revocationStatus);

  return (
    <>
      <DialogHeader className="border-b border-border/60 bg-muted/20 px-6 pt-6 pb-5 text-left">
        <div className="flex items-center gap-4 pr-8">
          <div className="[&>div]:size-14 [&>div]:rounded-2xl [&>div]:text-xl">
            <MemberAvatar member={member} />
          </div>
          <div className="min-w-0 space-y-1.5">
            <DialogTitle className="truncate text-xl">{member.displayName}</DialogTitle>
            <DialogDescription className="truncate">
              {member.username ? `@${member.username}` : member.discordUserId}
            </DialogDescription>
            <MemberStatusCell member={member} t={t} />
          </div>
        </div>
      </DialogHeader>

      <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem icon={Mail} label={t(translations.members.email)}>
            <span className="break-all">{member.gmail ?? t(translations.members.noEmail)}</span>
          </InfoItem>
          <InfoItem icon={UserRound} label={t(translations.members.memberId)}>
            <span className="font-mono text-xs break-all">{member.discordUserId}</span>
          </InfoItem>
          <InfoItem icon={CalendarDays} label={t(translations.members.joinedAt)}>
            {formatMemberDate(member.joinedAt, dateFormatter)}
          </InfoItem>
          <InfoItem icon={CreditCard} label={t(translations.members.qrDetails)}>
            {member.bankQr.configured
              ? t(translations.members.bankQrConfigured)
              : t(translations.members.bankQrNotConfigured)}
            {member.bankQr.configured && member.bankQr.fileName ? (
              <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                {t(translations.members.bankQrFile, { fileName: member.bankQr.fileName })}
              </p>
            ) : null}
          </InfoItem>
        </div>

        <InfoItem icon={Layers3} label={t(translations.members.stages)}>
          <div className="pt-1">
            <StageList emptyLabel={t(translations.members.noStages)} member={member} />
          </div>
        </InfoItem>

        <section className="space-y-2 rounded-xl border border-border/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{t(translations.members.taskClaim)}</h3>
            {member.status === 'LEFT' ? (
              <span className="text-right text-xs text-muted-foreground">
                {t(translations.members.leftReadOnly)}
              </span>
            ) : (
              <Button
                disabled={taskClaimPending}
                onClick={() => onTaskClaim(member, !taskClaimEnabled)}
                size="sm"
                variant={taskClaimEnabled ? 'destructive' : 'default'}
              >
                {taskClaimEnabled
                  ? t(translations.members.confirmBlock)
                  : t(translations.members.openTaskClaim)}
              </Button>
            )}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {t(translations.members.taskClaimUnchanged)}
          </p>
        </section>

        {showRevocation ? (
          <section className="space-y-3 rounded-xl border border-border/70 p-4">
            <div>
              <h3 className="text-sm font-semibold">{t(translations.members.revocation)}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(translations.members.revocationScope, { workspaceId })}
              </p>
            </div>
            {member.revocationStatus === 'PENDING' ? (
              <div className="space-y-1.5" role="status">
                <p className="text-sm leading-5 text-destructive">
                  {t(translations.members.cleanupPending)}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t(translations.members.revocationCounts, {
                    drive: member.pendingDriveGrantCount ?? 0,
                  })}
                </p>
                {member.revocationError ? (
                  <p className="text-xs break-words text-muted-foreground">
                    {t(translations.members.revocationError, {
                      error: member.revocationError,
                    })}
                  </p>
                ) : null}
              </div>
            ) : member.revocationStatus === 'COMPLETE' ? (
              <p className="text-sm leading-5 text-muted-foreground">
                {t(translations.members.cleanupComplete)}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {member.revocationStatus === 'PENDING' ? (
                <Button
                  disabled={memberActionPending}
                  onClick={() => onRetryRevocation(member)}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw aria-hidden="true" />
                  {t(translations.members.retryRevocation)}
                </Button>
              ) : null}
              {member.status === 'LEFT' ? (
                <Button
                  disabled={memberActionPending}
                  onClick={() => onActivate(member)}
                  size="sm"
                >
                  <ShieldCheck aria-hidden="true" />
                  {t(translations.members.activateMember)}
                </Button>
              ) : null}
            </div>
            {member.status === 'LEFT' ? (
              <p className="text-xs leading-5 text-muted-foreground">
                {t(translations.members.activateMemberDescription)}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}

export default function MembersPage() {
  const { i18n, t } = useTranslation();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [qrMember, setQrMember] = useState<Member | null>(null);
  const qrQuery = usePayrollBankQrQuery(
    workspaceId,
    qrMember?.discordUserId ?? '',
    qrMember !== null,
  );
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!qrQuery.data) {
      setQrUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(qrQuery.data);
    setQrUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [qrQuery.data]);
  const [pendingAction, setPendingAction] = useState<PendingTaskClaimAction | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<PendingMemberRemoval | null>(null);
  const membersQuery = useMembersQuery(workspaceId);
  const taskClaimMutation = useUpdateMemberTaskClaimMutation(workspaceId);
  const removeMemberMutation = useRemoveMemberMutation(workspaceId);
  const retryRevocationMutation = useRetryMemberRevocationMutation(workspaceId);
  const activateMemberMutation = useActivateMemberMutation(workspaceId);
  const [retryingAll, setRetryingAll] = useState(false);
  const pendingRevocationMembers = useMemo(
    () =>
      (membersQuery.data ?? []).filter((member) => member.revocationStatus === 'PENDING'),
    [membersQuery.data],
  );
  const memberActionPending =
    retryingAll ||
    removeMemberMutation.isPending ||
    retryRevocationMutation.isPending ||
    activateMemberMutation.isPending;
  const retryingId = retryRevocationMutation.isPending
    ? retryRevocationMutation.variables?.discordUserId
    : undefined;
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }),
    [i18n.language],
  );
  const counts = useMemo(() => {
    const members = membersQuery.data ?? [];
    return {
      total: members.length,
      active: members.filter((member) => member.status === 'ACTIVE').length,
      suspended: members.filter((member) => member.status === 'SUSPENDED').length,
      left: members.filter((member) => member.status === 'LEFT').length,
    };
  }, [membersQuery.data]);
  const filteredMembers = useMemo(() => {
    const members = membersQuery.data ?? [];
    if (statusFilter === 'ATTENTION') {
      return filterMembers(
        members.filter((member) => member.revocationStatus === 'PENDING'),
        search,
        'ALL',
      );
    }
    return filterMembers(members, search, statusFilter);
  }, [membersQuery.data, search, statusFilter]);

  function requestTaskClaimChange(member: Member, enabled: boolean): void {
    setPendingAction({ enabled, member });
  }

  function requestMemberRemoval(member: Member): void {
    setPendingRemoval({ member });
  }

  function retryRevocation(member: Member): void {
    retryRevocationMutation.mutate(
      { discordUserId: member.discordUserId },
      {
        onSuccess: (result) => {
          setSelectedMember((current) =>
            current?.discordUserId === result.member.discordUserId
              ? result.member
              : current,
          );
          if (result.member.revocationStatus === 'PENDING') {
            toast.warning(t(translations.members.cleanupPending));
          } else {
            toast.success(t(translations.members.cleanupComplete));
          }
        },
        onError: (error: Error) =>
          toast.error(
            isForbiddenError(error) ? t(translations.members.forbidden) : formatError(error),
          ),
      },
    );
  }

  async function retryAllRevocations(): Promise<void> {
    const targets = pendingRevocationMembers;
    if (targets.length === 0) return;
    setRetryingAll(true);
    let success = 0;
    let forbidden = false;
    let lastError: string | null = null;
    for (const member of targets) {
      try {
        const result = await retryRevocationMutation.mutateAsync({
          discordUserId: member.discordUserId,
        });
        if (result.member.revocationStatus !== 'PENDING') success += 1;
      } catch (error: unknown) {
        if (isForbiddenError(error)) {
          forbidden = true;
          break;
        }
        lastError = formatError(error);
      }
    }
    setRetryingAll(false);
    if (forbidden) {
      toast.error(t(translations.members.forbidden));
      return;
    }
    const failed = targets.length - success;
    const message = t(translations.members.retryAllResult, {
      success,
      total: targets.length,
      failed,
    });
    if (failed > 0) {
      toast.warning(lastError ? `${message} ${lastError}` : message);
    } else toast.success(message);
  }

  function showRevocationResult(result: MemberRemovalResult): void {
    setSelectedMember((current) =>
      current?.discordUserId === result.member.discordUserId
        ? result.member
        : current,
    );
    setPendingRemoval(null);
    if (result.member.revocationStatus === 'PENDING') {
      toast.warning(
        t(translations.members.memberRemovedPending, {
          unassigned: result.unassignedTaskCount,
          locked: result.payrollLockedTaskCount,
        }),
      );
      return;
    }
    toast.success(
      t(translations.members.memberRemoved, {
        unassigned: result.unassignedTaskCount,
        locked: result.payrollLockedTaskCount,
      }),
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t(translations.members.title)}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t(translations.members.description)}
        </p>
      </div>

      {membersQuery.data && membersQuery.data.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          <SummaryFilter
            active={statusFilter === 'ALL'}
            count={counts.total}
            label={t(translations.members.filterAll)}
            onClick={() => setStatusFilter('ALL')}
          />
          <SummaryFilter
            active={statusFilter === 'ACTIVE'}
            count={counts.active}
            label={t(translations.members.statusActive)}
            onClick={() => setStatusFilter('ACTIVE')}
          />
          <SummaryFilter
            active={statusFilter === 'SUSPENDED'}
            count={counts.suspended}
            label={t(translations.members.statusSuspended)}
            onClick={() => setStatusFilter('SUSPENDED')}
          />
          <SummaryFilter
            active={statusFilter === 'LEFT'}
            count={counts.left}
            label={t(translations.members.statusLeft)}
            onClick={() => setStatusFilter('LEFT')}
          />
          {pendingRevocationMembers.length > 0 ? (
            <SummaryFilter
              active={statusFilter === 'ATTENTION'}
              count={pendingRevocationMembers.length}
              label={t(translations.members.needsAttention)}
              onClick={() => setStatusFilter('ATTENTION')}
              tone="warning"
            />
          ) : null}
        </div>
      ) : null}

      {pendingRevocationMembers.length > 0 ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <div className="flex items-start gap-3 text-sm">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span>
              {t(translations.members.attentionBanner, {
                count: pendingRevocationMembers.length,
              })}
            </span>
          </div>
          <Button
            disabled={memberActionPending}
            onClick={() => void retryAllRevocations()}
            size="sm"
            variant="outline"
          >
            <RefreshCw aria-hidden="true" className={retryingAll ? 'animate-spin' : undefined} />
            {t(translations.members.retryAllRevocations, {
              count: pendingRevocationMembers.length,
            })}
          </Button>
        </div>
      ) : null}

      <Card className="border-border/70 shadow-[var(--soft-shadow)]">
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t(translations.members.memberCount, { count: filteredMembers.length })}
          </p>
          <div className="relative w-full sm:w-80">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label={t(translations.members.search)}
              className="pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t(translations.members.search)}
              value={search}
            />
          </div>
        </div>

        <CardContent className="p-0">
          {membersQuery.isLoading ? (
            <div className="p-4"><LoadingMembers label={t(translations.members.loading)} /></div>
          ) : null}

          {membersQuery.isError ? (
            <Empty className="m-4 border border-destructive/20 bg-destructive/5 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldOff />
                </EmptyMedia>
                <EmptyTitle>
                  {isForbiddenError(membersQuery.error)
                    ? t(translations.members.forbiddenTitle)
                    : t(translations.members.error)}
                </EmptyTitle>
                <EmptyDescription>
                  {isForbiddenError(membersQuery.error)
                    ? t(translations.members.forbidden)
                    : formatError(membersQuery.error)}
                </EmptyDescription>
              </EmptyHeader>
              {!isForbiddenError(membersQuery.error) ? (
                <Button onClick={() => void membersQuery.refetch()} variant="outline">
                  {t(translations.members.retry)}
                </Button>
              ) : null}
            </Empty>
          ) : null}

          {!membersQuery.isLoading && !membersQuery.isError && membersQuery.data?.length === 0 ? (
            <Empty className="m-4 border border-border/70 bg-muted/20 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersRound />
                </EmptyMedia>
                <EmptyTitle>{t(translations.members.empty)}</EmptyTitle>
                <EmptyDescription>{t(translations.members.emptyDescription)}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}

          {!membersQuery.isLoading && !membersQuery.isError && membersQuery.data?.length && filteredMembers.length === 0 ? (
            <Empty className="m-4 border border-border/70 bg-muted/20 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>{t(translations.members.emptyFiltered)}</EmptyTitle>
                <EmptyDescription>{t(translations.members.emptyFilteredDescription)}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}

          {filteredMembers.length > 0 ? (
            <>
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="px-4">{t(translations.members.discordMember)}</TableHead>
                      <TableHead className="px-4">{t(translations.members.stages)}</TableHead>
                      <TableHead className="px-4">{t(translations.members.status)}</TableHead>
                      <TableHead className="px-4">{t(translations.members.bankQr)}</TableHead>
                      <TableHead className="w-12 px-4">
                        <span className="sr-only">{t(translations.members.actions)}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <MemberRow
                        emptyLabel={t(translations.members.noEmail)}
                        key={member.discordUserId}
                        member={member}
                        onRemove={requestMemberRemoval}
                        onRetryRevocation={retryRevocation}
                        onView={setSelectedMember}
                        onViewQr={setQrMember}
                        retryDisabled={memberActionPending}
                        retrying={retryingId === member.discordUserId}
                        t={t}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-3 p-4 lg:hidden">
                {filteredMembers.map((member) => (
                  <MemberCard
                    emptyLabel={t(translations.members.noEmail)}
                    key={member.discordUserId}
                    member={member}
                    onRemove={requestMemberRemoval}
                    onRetryRevocation={retryRevocation}
                    onView={setSelectedMember}
                        onViewQr={setQrMember}
                    retryDisabled={memberActionPending}
                    retrying={retryingId === member.discordUserId}
                    t={t}
                  />
                ))}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null);
        }}
        open={selectedMember !== null}
      >
        <DialogContent className="gap-0 p-0 sm:max-w-xl">
          {selectedMember ? (
            <MemberDetails
              dateFormatter={dateFormatter}
              member={selectedMember}
              workspaceId={workspaceId}
              onTaskClaim={requestTaskClaimChange}
              onRetryRevocation={retryRevocation}
              onActivate={(member) =>
                activateMemberMutation.mutate(
                  { discordUserId: member.discordUserId },
                  {
                    onSuccess: (updatedMember) => {
                      setSelectedMember(updatedMember);
                      toast.success(t(translations.members.activated));
                    },
                    onError: (error: Error) =>
                      toast.error(
                        isForbiddenError(error)
                          ? t(translations.members.forbidden)
                          : formatError(error),
                      ),
                  },
                )
              }
              memberActionPending={memberActionPending}
              taskClaimPending={taskClaimMutation.isPending}
              t={t}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setQrMember(null);
        }}
        open={qrMember !== null}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t(translations.members.bankQr)}</DialogTitle>
            <DialogDescription>{qrMember?.displayName}</DialogDescription>
          </DialogHeader>
          {qrQuery.isLoading ? (
            <Skeleton className="mx-auto h-64 w-64 rounded-xl" />
          ) : qrQuery.isError ? (
            <p className="rounded-xl bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {t(translations.members.bankQrError)}
            </p>
          ) : qrUrl ? (
            <div className="flex justify-center rounded-xl border border-border/70 bg-white p-3">
              <img
                alt={t(translations.members.bankQr)}
                className="max-h-80 w-auto object-contain"
                src={qrUrl}
              />
            </div>
          ) : null}
          {qrMember?.bankQr.fileName ? (
            <p className="text-center text-xs break-words text-muted-foreground">
              {qrMember.bankQr.fileName}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !taskClaimMutation.isPending) setPendingAction(null);
        }}
        open={pendingAction !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.enabled
                ? t(translations.members.confirmEnable)
                : t(translations.members.confirmBlock)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.enabled
                ? t(translations.members.confirmEnableDescription, {
                    name: pendingAction.member.displayName,
                  })
                : t(translations.members.confirmBlockDescription, {
                    name: pendingAction?.member.displayName ?? '',
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={taskClaimMutation.isPending}>
              {t(translations.members.confirmCancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={taskClaimMutation.isPending || pendingAction === null}
              onClick={() => {
                if (!pendingAction) return;
                taskClaimMutation.mutate(
                  {
                    discordUserId: pendingAction.member.discordUserId,
                    enabled: pendingAction.enabled,
                  },
                  {
                    onSuccess: (updatedMember) => {
                      setSelectedMember(updatedMember);
                      setPendingAction(null);
                      toast.success(t(translations.members.updated));
                    },
                    onError: (error: Error) =>
                      toast.error(
                        isForbiddenError(error)
                          ? t(translations.members.forbidden)
                          : formatError(error),
                      ),
                  },
                );
              }}
            >
              {t(translations.members.confirmAction)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !removeMemberMutation.isPending) setPendingRemoval(null);
        }}
        open={pendingRemoval !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(translations.members.confirmRemove)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(translations.members.confirmRemoveDescription, {
                name: pendingRemoval?.member.displayName ?? '',
                workspaceId,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMemberMutation.isPending}>
              {t(translations.members.confirmCancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={removeMemberMutation.isPending || pendingRemoval === null}
              onClick={() => {
                if (!pendingRemoval) return;
                removeMemberMutation.mutate(
                  { discordUserId: pendingRemoval.member.discordUserId },
                  {
                    onSuccess: showRevocationResult,
                    onError: (error: Error) =>
                      toast.error(
                        isForbiddenError(error)
                          ? t(translations.members.forbidden)
                          : formatError(error),
                      ),
                  },
                );
              }}
              variant="destructive"
            >
              {t(translations.members.removeMember)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
