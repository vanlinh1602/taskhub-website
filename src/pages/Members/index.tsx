import {
  CalendarDays,
  Check,
  CreditCard,
  Layers3,
  Mail,
  Search,
  ShieldCheck,
  ShieldOff,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  useMembersQuery,
  useUpdateMemberTaskClaimMutation,
} from '@/features/members/hooks';
import type { Member, MemberStatus } from '@/features/members/types';
import { filterMembers } from '@/features/members/utils';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

type StatusFilter = MemberStatus | 'ALL';

interface PendingTaskClaimAction {
  readonly enabled: boolean;
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
    return 'bg-primary/10 text-primary';
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
    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 font-semibold text-primary">
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
}: {
  readonly member: Member;
  readonly emptyLabel: string;
}) {
  if (member.stages.length === 0) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {member.stages.map((stage) => (
        <span
          className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
          key={stage.id}
          title={stage.code}
        >
          {stage.name}
        </span>
      ))}
    </div>
  );
}

function MemberRow({
  member,
  dateFormatter,
  emptyLabel,
  onView,
  t,
}: {
  readonly member: Member;
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly emptyLabel: string;
  readonly onView: (member: Member) => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <TableRow className="border-border/60 hover:bg-muted/30">
      <TableCell className="px-4 py-4 align-top">
        <div className="flex min-w-48 items-center gap-3">
          <MemberAvatar member={member} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{member.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {member.username ? `@${member.username}` : member.discordUserId}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="max-w-56 px-4 py-4 align-top text-sm text-muted-foreground">
        <span className="line-clamp-2 break-words">
          {member.gmail ?? emptyLabel}
        </span>
      </TableCell>
      <TableCell className="min-w-40 px-4 py-4 align-top">
        <StageList emptyLabel={emptyLabel} member={member} />
      </TableCell>
      <TableCell className="px-4 py-4 align-top">
        <StatusPill status={member.status} t={t} />
      </TableCell>
      <TableCell className="px-4 py-4 align-top">
        <div className="flex items-center gap-2 text-sm">
          <CreditCard aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className={member.bankQr.configured ? 'text-foreground' : 'text-muted-foreground'}>
            {member.bankQr.configured
              ? t(translations.members.bankQrConfigured)
              : t(translations.members.bankQrNotConfigured)}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-4 align-top text-sm whitespace-nowrap text-muted-foreground">
        {formatMemberDate(member.joinedAt, dateFormatter)}
      </TableCell>
      <TableCell className="px-4 py-4 text-right align-top">
        <Button onClick={() => onView(member)} size="sm" variant="outline">
          {t(translations.members.viewDetails)}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function MemberCard({
  member,
  dateFormatter,
  emptyLabel,
  onView,
  t,
}: {
  readonly member: Member;
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly emptyLabel: string;
  readonly onView: (member: Member) => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--soft-shadow)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MemberAvatar member={member} />
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{member.displayName}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {member.username ? `@${member.username}` : member.discordUserId}
            </p>
          </div>
        </div>
        <StatusPill status={member.status} t={t} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <div className="grid grid-cols-[7rem_1fr] gap-3">
          <dt className="text-muted-foreground">{t(translations.members.email)}</dt>
          <dd className="text-right break-words">{member.gmail ?? emptyLabel}</dd>
        </div>
        <div className="grid grid-cols-[7rem_1fr] gap-3">
          <dt className="text-muted-foreground">{t(translations.members.stages)}</dt>
          <dd className="text-right">
            <div className="flex justify-end">
              <StageList emptyLabel={emptyLabel} member={member} />
            </div>
          </dd>
        </div>
        <div className="grid grid-cols-[7rem_1fr] gap-3">
          <dt className="text-muted-foreground">{t(translations.members.bankQr)}</dt>
          <dd className="text-right">
            {member.bankQr.configured
              ? t(translations.members.bankQrConfigured)
              : t(translations.members.bankQrNotConfigured)}
          </dd>
        </div>
        <div className="grid grid-cols-[7rem_1fr] gap-3">
          <dt className="text-muted-foreground">{t(translations.members.joinedAt)}</dt>
          <dd className="text-right text-muted-foreground">
            {formatMemberDate(member.joinedAt, dateFormatter)}
          </dd>
        </div>
      </dl>

      <Button className="mt-4 w-full" onClick={() => onView(member)} variant="outline">
        {t(translations.members.viewDetails)}
      </Button>
    </article>
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

function MemberDetails({
  member,
  dateFormatter,
  onTaskClaim,
  taskClaimPending,
  t,
}: {
  readonly member: Member;
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly onTaskClaim: (member: Member, enabled: boolean) => void;
  readonly taskClaimPending: boolean;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const taskClaimEnabled = member.status === 'ACTIVE';

  return (
    <>
      <SheetHeader className="border-b border-border/60 pb-5">
        <div className="flex items-center gap-3 pr-8">
          <MemberAvatar member={member} />
          <div className="min-w-0">
            <SheetTitle className="truncate text-lg">{member.displayName}</SheetTitle>
            <SheetDescription className="mt-1 truncate">
              {member.username ? `@${member.username}` : member.discordUserId}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-4">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t(translations.members.discordMember)}</h3>
          <dl className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm">
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <dt className="text-muted-foreground">{t(translations.members.displayName)}</dt>
              <dd className="text-right font-medium break-words">{member.displayName}</dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <dt className="text-muted-foreground">{t(translations.members.memberId)}</dt>
              <dd className="text-right font-mono text-xs break-all">{member.discordUserId}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t(translations.members.taskClaim)}</h3>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-4">
            <StatusPill status={member.status} t={t} />
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

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t(translations.members.email)}</h3>
          <div className="flex items-start gap-3 rounded-xl border border-border/70 p-4 text-sm">
            <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="break-all">{member.gmail ?? t(translations.members.noEmail)}</span>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t(translations.members.stages)}</h3>
          <div className="flex items-start gap-3 rounded-xl border border-border/70 p-4">
            <Layers3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <StageList emptyLabel={t(translations.members.noStages)} member={member} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/70 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-4" />
              {t(translations.members.joinedAt)}
            </div>
            <p className="mt-2 text-sm font-medium">{formatMemberDate(member.joinedAt, dateFormatter)}</p>
          </div>
          <div className="rounded-xl border border-border/70 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CreditCard aria-hidden="true" className="size-4" />
              {t(translations.members.qrDetails)}
            </div>
            <p className="mt-2 text-sm font-medium">
              {member.bankQr.configured
                ? t(translations.members.bankQrConfigured)
                : t(translations.members.bankQrNotConfigured)}
            </p>
            {member.bankQr.configured && member.bankQr.fileName ? (
              <p className="mt-1 text-xs break-words text-muted-foreground">
                {t(translations.members.bankQrFile, { fileName: member.bankQr.fileName })}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <SheetFooter className="border-t border-border/60">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="size-4" />
          {t(translations.members.description)}
        </div>
      </SheetFooter>
    </>
  );
}

export default function MembersPage() {
  const { i18n, t } = useTranslation();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingTaskClaimAction | null>(null);
  const membersQuery = useMembersQuery(workspaceId);
  const taskClaimMutation = useUpdateMemberTaskClaimMutation(workspaceId);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }),
    [i18n.language],
  );
  const filteredMembers = useMemo(
    () => filterMembers(membersQuery.data ?? [], search, statusFilter),
    [membersQuery.data, search, statusFilter],
  );

  function requestTaskClaimChange(member: Member, enabled: boolean): void {
    setPendingAction({ enabled, member });
  }

  return (
    <section className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t(translations.members.title)}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t(translations.members.description)}
        </p>
      </div>

      <Card className="border-border/70 shadow-[var(--soft-shadow)]">
        <CardHeader className="gap-4 border-b border-border/60 sm:flex sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>{t(translations.members.memberDetails)}</CardTitle>
            <CardDescription className="mt-1">
              {t(translations.members.memberCount, { count: membersQuery.data?.length ?? 0 })}
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:w-72">
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
            <Select
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              value={statusFilter}
            >
              <SelectTrigger aria-label={t(translations.members.statusFilter)} className="w-full sm:w-44">
                <SelectValue placeholder={t(translations.members.statusFilter)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t(translations.members.statusFilter)}</SelectItem>
                <SelectItem value="ACTIVE">{t(translations.members.statusActive)}</SelectItem>
                <SelectItem value="SUSPENDED">{t(translations.members.statusSuspended)}</SelectItem>
                <SelectItem value="LEFT">{t(translations.members.statusLeft)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          {membersQuery.isLoading ? (
            <LoadingMembers label={t(translations.members.loading)} />
          ) : null}

          {membersQuery.isError ? (
            <Empty className="border border-destructive/20 bg-destructive/5 py-12">
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
            <Empty className="border border-border/70 bg-muted/20 py-12">
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
            <Empty className="border border-border/70 bg-muted/20 py-12">
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
                <Table className="min-w-[960px]">
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead>{t(translations.members.discordMember)}</TableHead>
                      <TableHead>{t(translations.members.email)}</TableHead>
                      <TableHead>{t(translations.members.stages)}</TableHead>
                      <TableHead>{t(translations.members.taskClaim)}</TableHead>
                      <TableHead>{t(translations.members.bankQr)}</TableHead>
                      <TableHead>{t(translations.members.joinedAt)}</TableHead>
                      <TableHead className="text-right">{t(translations.members.viewDetails)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <MemberRow
                        dateFormatter={dateFormatter}
                        emptyLabel={t(translations.members.noEmail)}
                        key={member.discordUserId}
                        member={member}
                        onView={setSelectedMember}
                        t={t}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-3 lg:hidden">
                {filteredMembers.map((member) => (
                  <MemberCard
                    dateFormatter={dateFormatter}
                    emptyLabel={t(translations.members.noEmail)}
                    key={member.discordUserId}
                    member={member}
                    onView={setSelectedMember}
                    t={t}
                  />
                ))}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Sheet
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null);
        }}
        open={selectedMember !== null}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selectedMember ? (
            <MemberDetails
              dateFormatter={dateFormatter}
              member={selectedMember}
              onTaskClaim={requestTaskClaimChange}
              taskClaimPending={taskClaimMutation.isPending}
              t={t}
            />
          ) : null}
        </SheetContent>
      </Sheet>

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
    </section>
  );
}
