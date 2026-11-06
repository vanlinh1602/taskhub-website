import {
  CalendarClock,
  Check,
  Clock3,
  LoaderCircle,
  Search,
  ShieldOff,
  X,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { FetchingBadge } from '@/components/fetching-overlay';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  useApproveDeadlineExtensionMutation,
  useDeadlineExtensionsQuery,
  useRejectDeadlineExtensionMutation,
} from '@/features/deadline-extensions/hooks';
import type {
  DeadlineExtensionRequest,
  DeadlineExtensionStatus,
  DeadlineExtensionStatusFilter,
} from '@/features/deadline-extensions/types';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

const PAGE_SIZE = 25;
const STATUS_FILTERS: readonly DeadlineExtensionStatusFilter[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'ALL',
];

function isForbiddenError(error: unknown): boolean {
  if (!error) return false;
  const message = formatError(error).toLocaleLowerCase();
  return (
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('quyền')
  );
}

function getStatusLabel(
  status: DeadlineExtensionStatusFilter,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (status === 'PENDING')
    return t(translations.management.deadlineExtensions.pending);
  if (status === 'APPROVED')
    return t(translations.management.deadlineExtensions.approved);
  if (status === 'REJECTED')
    return t(translations.management.deadlineExtensions.rejected);
  return t(translations.management.deadlineExtensions.all);
}

function StatusBadge({
  status,
  t,
}: {
  readonly status: DeadlineExtensionStatus;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const className =
    status === 'PENDING'
      ? 'bg-primary/10 text-link'
      : status === 'APPROVED'
        ? 'bg-accent text-accent-foreground'
        : 'bg-destructive/10 text-destructive';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {getStatusLabel(status, t)}
    </span>
  );
}

function DateValue({
  formatter,
  value,
  t,
}: {
  readonly formatter: Intl.DateTimeFormat;
  readonly value: string | null;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  if (!value) {
    return (
      <span className="text-sm text-muted-foreground">
        {t(translations.management.deadlineExtensions.noDeadline)}
      </span>
    );
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return (
      <span className="text-sm text-muted-foreground">
        {t(translations.management.deadlineExtensions.invalidDate)}
      </span>
    );
  }

  return (
    <time className="text-sm" dateTime={value} title={date.toLocaleString()}>
      {formatter.format(date)}
    </time>
  );
}

function RequesterValue({
  request,
  t,
}: {
  readonly request: DeadlineExtensionRequest;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold">
        {request.requesterDisplayName ?? request.requesterDiscordUserId}
      </p>
      <p className="truncate font-mono text-xs text-muted-foreground">
        {t(translations.management.deadlineExtensions.requesterId, {
          id: request.requesterDiscordUserId,
        })}
      </p>
    </div>
  );
}

function LoadingRequests({ label }: { readonly label: string }) {
  return (
    <div aria-label={label} className="space-y-3 px-4" role="status">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton className="h-16 w-full" key={index} />
      ))}
    </div>
  );
}

function RequestTable({
  dateFormatter,
  onApprove,
  onReject,
  onSelect,
  requests,
  t,
}: {
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly onApprove: (request: DeadlineExtensionRequest) => void;
  readonly onReject: (request: DeadlineExtensionRequest) => void;
  readonly onSelect: (request: DeadlineExtensionRequest) => void;
  readonly requests: readonly DeadlineExtensionRequest[];
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <Table className="min-w-[860px]">
        <TableHeader>
          <TableRow className="border-border/60 bg-muted/35 hover:bg-transparent">
            <TableHead>
              {t(translations.management.deadlineExtensions.requester)}
            </TableHead>
            <TableHead>
              {t(translations.management.deadlineExtensions.task)}
            </TableHead>
            <TableHead>
              {t(translations.management.deadlineExtensions.requestedHours)}
            </TableHead>
            <TableHead>
              {t(translations.management.deadlineExtensions.newDeadline)}
            </TableHead>
            <TableHead className="text-right">
              {t(translations.management.deadlineExtensions.status)}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow
              className="cursor-pointer"
              key={request.id}
              onClick={() => onSelect(request)}
            >
              <TableCell>
                <RequesterValue request={request} t={t} />
              </TableCell>
              <TableCell className="max-w-72">
                <p
                  className="truncate font-semibold"
                  title={request.storyTitle}
                >
                  {request.storyTitle}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {request.chapterName} · {request.stageName}
                </p>
              </TableCell>
              <TableCell className="font-bold text-link">
                +
                {t(translations.management.deadlineExtensions.hours, {
                  count: request.requestedHours,
                })}
              </TableCell>
              <TableCell>
                <div className="text-xs text-muted-foreground line-through">
                  <DateValue
                    formatter={dateFormatter}
                    t={t}
                    value={request.dueAt}
                  />
                </div>
                <div className="font-semibold">
                  <DateValue
                    formatter={dateFormatter}
                    t={t}
                    value={
                      request.projectedDueAt ??
                      (request.status === 'APPROVED' ? request.dueAt : null)
                    }
                  />
                </div>
              </TableCell>
              <TableCell className="text-right">
                {request.status === 'PENDING' ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      aria-label={t(
                        translations.management.deadlineExtensions.reject,
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        onReject(request);
                      }}
                      size="icon"
                      title={t(
                        translations.management.deadlineExtensions.reject,
                      )}
                      variant="outline"
                    >
                      <X aria-hidden="true" className="text-destructive" />
                    </Button>
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        onApprove(request);
                      }}
                    >
                      <Check aria-hidden="true" />
                      {t(translations.management.deadlineExtensions.approve)}
                    </Button>
                  </div>
                ) : (
                  <StatusBadge status={request.status} t={t} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RequestCardList({
  dateFormatter,
  onSelect,
  requests,
  t,
}: {
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly onSelect: (request: DeadlineExtensionRequest) => void;
  readonly requests: readonly DeadlineExtensionRequest[];
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="grid gap-3 px-4 lg:hidden">
      {requests.map((request) => (
        <article
          className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"
          key={request.id}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">
                {t(translations.management.deadlineExtensions.task)} #
                {request.taskId}
              </p>
              <h3
                className="mt-1 truncate font-semibold"
                title={request.storyTitle}
              >
                {request.storyTitle}
              </h3>
              <p
                className="truncate text-sm text-muted-foreground"
                title={request.chapterName}
              >
                {request.chapterName} · {request.stageName}
              </p>
            </div>
            <StatusBadge status={request.status} t={t} />
          </div>
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-3">
            <RequesterValue request={request} t={t} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">
                {t(translations.management.deadlineExtensions.requestedHours)}
              </dt>
              <dd className="mt-1 font-semibold">
                {t(translations.management.deadlineExtensions.hours, {
                  count: request.requestedHours,
                })}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t(translations.management.deadlineExtensions.currentDeadline)}
              </dt>
              <dd className="mt-1">
                <DateValue
                  formatter={dateFormatter}
                  t={t}
                  value={request.dueAt}
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t(
                  translations.management.deadlineExtensions.projectedDeadline,
                )}
              </dt>
              <dd className="mt-1">
                <DateValue
                  formatter={dateFormatter}
                  t={t}
                  value={
                    request.projectedDueAt ??
                    (request.status === 'APPROVED' ? request.dueAt : null)
                  }
                />
              </dd>
            </div>
          </dl>
          <Button
            className="mt-4 w-full"
            onClick={() => onSelect(request)}
            variant="outline"
          >
            {t(translations.management.deadlineExtensions.viewDetails)}
          </Button>
        </article>
      ))}
    </div>
  );
}

function RequestDetails({
  dateFormatter,
  onApprove,
  onReject,
  request,
  t,
}: {
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly onApprove: (request: DeadlineExtensionRequest) => void;
  readonly onReject: (request: DeadlineExtensionRequest) => void;
  readonly request: DeadlineExtensionRequest;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const isPending = request.status === 'PENDING';

  return (
    <>
      <DialogHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={request.status} t={t} />
          <span className="font-mono text-xs text-muted-foreground">
            #{request.id}
          </span>
        </div>
        <DialogTitle className="mt-1">
          {t(translations.management.deadlineExtensions.details)}
        </DialogTitle>
        <DialogDescription>
          {request.storyTitle} · {request.chapterName} · {request.stageName}
        </DialogDescription>
      </DialogHeader>
      <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">
            {t(translations.management.deadlineExtensions.requester)}
          </h3>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <RequesterValue request={request} t={t} />
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">
            {t(translations.management.deadlineExtensions.task)}
          </h3>
          <dl className="grid gap-3 rounded-xl border border-border/70 p-4 text-sm">
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <dt className="text-muted-foreground">
                {t(translations.management.deadlineExtensions.task)}
              </dt>
              <dd className="text-right font-mono font-medium">
                {t(translations.management.deadlineExtensions.taskId, {
                  id: request.taskId,
                })}
              </dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <dt className="text-muted-foreground">
                {t(translations.management.deadlineExtensions.story)}
              </dt>
              <dd className="text-right font-medium break-words">
                {request.storyTitle}
              </dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <dt className="text-muted-foreground">
                {t(translations.management.deadlineExtensions.chapter)}
              </dt>
              <dd className="text-right font-medium break-words">
                {request.chapterName}
              </dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <dt className="text-muted-foreground">
                {t(translations.management.deadlineExtensions.stage)}
              </dt>
              <dd className="text-right font-medium break-words">
                {request.stageName}
              </dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <dt className="text-muted-foreground">
                {t(translations.management.deadlineExtensions.requestedHours)}
              </dt>
              <dd className="text-right font-semibold">
                {t(translations.management.deadlineExtensions.hours, {
                  count: request.requestedHours,
                })}
              </dd>
            </div>
          </dl>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">
            {t(translations.management.deadlineExtensions.currentDeadline)}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 aria-hidden="true" className="size-4" />
                {t(translations.management.deadlineExtensions.currentDeadline)}
              </div>
              <p className="mt-2 font-medium">
                <DateValue
                  formatter={dateFormatter}
                  t={t}
                  value={request.dueAt}
                />
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-xs text-link">
                <CalendarClock aria-hidden="true" className="size-4" />
                {isPending
                  ? t(
                      translations.management.deadlineExtensions
                        .projectedDeadline,
                    )
                  : request.status === 'APPROVED'
                    ? t(translations.management.deadlineExtensions.newDeadline)
                    : t(
                        translations.management.deadlineExtensions
                          .currentDeadline,
                      )}
              </div>
              <p className="mt-2 font-medium">
                <DateValue
                  formatter={dateFormatter}
                  t={t}
                  value={
                    request.projectedDueAt ??
                    (request.status === 'APPROVED' ? request.dueAt : null)
                  }
                />
              </p>
            </div>
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">
            {t(translations.management.deadlineExtensions.createdAt)}
          </h3>
          <div className="rounded-xl border border-border/70 p-4 text-sm">
            <DateValue
              formatter={dateFormatter}
              t={t}
              value={request.createdAt}
            />
          </div>
        </section>
        {!isPending ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">
              {t(translations.management.deadlineExtensions.reviewer)}
            </h3>
            <div className="rounded-xl border border-border/70 p-4 text-sm">
              <p className="font-medium">
                {request.reviewerDisplayName ??
                  request.reviewerDiscordUserId ??
                  '—'}
              </p>
              {request.reviewerDisplayName ? (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {request.reviewerDiscordUserId}
                </p>
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">
                {t(translations.management.deadlineExtensions.reviewedAt)}:{' '}
                <DateValue
                  formatter={dateFormatter}
                  t={t}
                  value={request.reviewedAt}
                />
              </p>
              {request.status === 'REJECTED' ? (
                <div className="mt-4 border-t border-border/60 pt-3">
                  <p className="text-xs text-muted-foreground">
                    {t(
                      translations.management.deadlineExtensions
                        .rejectionReason,
                    )}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {request.rejectionReason ??
                      t(translations.management.deadlineExtensions.noReason)}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
      {isPending ? (
        <DialogFooter>
          <Button onClick={() => onReject(request)} variant="destructive">
            <X aria-hidden="true" />
            {t(translations.management.deadlineExtensions.reject)}
          </Button>
          <Button onClick={() => onApprove(request)}>
            <Check aria-hidden="true" />
            {t(translations.management.deadlineExtensions.approve)}
          </Button>
        </DialogFooter>
      ) : null}
    </>
  );
}

export default function DeadlineExtensionsPage() {
  const { i18n, t } = useTranslation();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const [status, setStatus] =
    useState<DeadlineExtensionStatusFilter>('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRequest, setSelectedRequest] =
    useState<DeadlineExtensionRequest | null>(null);
  const [approveTarget, setApproveTarget] =
    useState<DeadlineExtensionRequest | null>(null);
  const [rejectTarget, setRejectTarget] =
    useState<DeadlineExtensionRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const listQuery = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, search, status }),
    [page, search, status],
  );
  const requestsQuery = useDeadlineExtensionsQuery(workspaceId, listQuery);
  const approveMutation = useApproveDeadlineExtensionMutation(workspaceId);
  const rejectMutation = useRejectDeadlineExtensionMutation(workspaceId);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [i18n.language],
  );
  const requests = requestsQuery.data?.items ?? [];

  function changeStatus(nextStatus: DeadlineExtensionStatusFilter): void {
    setStatus(nextStatus);
    setPage(0);
  }

  function handleSearch(value: string): void {
    setSearch(value);
    setPage(0);
  }

  function showMutationError(error: Error): void {
    toast.error(formatError(error));
    void requestsQuery.refetch();
  }

  function submitApproval(event: React.MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    if (!approveTarget) return;
    approveMutation.mutate(approveTarget.id, {
      onSuccess: (updatedRequest) => {
        setSelectedRequest(updatedRequest);
        setApproveTarget(null);
        toast.success(
          t(translations.management.deadlineExtensions.approvedToast),
        );
      },
      onError: showMutationError,
    });
  }

  function submitRejection(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!rejectTarget) return;
    rejectMutation.mutate(
      { reason: rejectionReason, requestId: rejectTarget.id },
      {
        onSuccess: (updatedRequest) => {
          setSelectedRequest(updatedRequest);
          setRejectTarget(null);
          setRejectionReason('');
          toast.success(
            t(translations.management.deadlineExtensions.rejectedToast),
          );
        },
        onError: showMutationError,
      },
    );
  }

  function openReject(request: DeadlineExtensionRequest): void {
    setRejectionReason('');
    setRejectTarget(request);
  }

  function closeRejectDialog(open: boolean): void {
    if (!open && !rejectMutation.isPending) {
      setRejectTarget(null);
      setRejectionReason('');
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t(translations.management.deadlineExtensions.title)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {getStatusLabel(status, t)} ·{' '}
            {t(translations.management.deadlineExtensions.count, {
              count: requestsQuery.data?.total ?? 0,
            })}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label={t(translations.management.deadlineExtensions.search)}
            className="pl-9"
            onChange={(event) => handleSearch(event.target.value)}
            placeholder={t(translations.management.deadlineExtensions.search)}
            value={search}
          />
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 py-0 shadow-[var(--soft-shadow)]">
        <CardContent
          className={`relative space-y-4 px-0 pt-2 pb-4 transition-opacity ${requestsQuery.isFetching && !requestsQuery.isLoading ? 'opacity-60' : ''}`}
          aria-busy={requestsQuery.isFetching}
        >
          <FetchingBadge
            active={requestsQuery.isFetching && !requestsQuery.isLoading}
          />
          <div
            aria-label={t(translations.management.deadlineExtensions.title)}
            className="flex gap-1 overflow-x-auto border-b border-border/60 px-4"
            role="tablist"
          >
            {STATUS_FILTERS.map((filter) => (
              <button
                aria-selected={status === filter}
                className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${status === filter ? 'border-primary text-link' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}`}
                key={filter}
                onClick={() => changeStatus(filter)}
                role="tab"
                type="button"
              >
                {getStatusLabel(filter, t)}
              </button>
            ))}
          </div>

          {!workspaceId ? (
            <Empty className="min-h-72 border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldOff />
                </EmptyMedia>
                <EmptyTitle>
                  {t(translations.management.deadlineExtensions.noWorkspace)}
                </EmptyTitle>
                <EmptyDescription>
                  {t(
                    translations.management.deadlineExtensions
                      .noWorkspaceDescription,
                  )}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : requestsQuery.isError ? (
            <Empty className="min-h-72 border border-destructive/20 bg-destructive/5">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldOff />
                </EmptyMedia>
                <EmptyTitle>
                  {isForbiddenError(requestsQuery.error)
                    ? t(translations.management.deadlineExtensions.forbidden)
                    : t(translations.management.deadlineExtensions.error)}
                </EmptyTitle>
                <EmptyDescription>
                  {isForbiddenError(requestsQuery.error)
                    ? t(translations.management.deadlineExtensions.forbidden)
                    : formatError(requestsQuery.error)}
                </EmptyDescription>
              </EmptyHeader>
              {!isForbiddenError(requestsQuery.error) ? (
                <Button
                  onClick={() => void requestsQuery.refetch()}
                  variant="outline"
                >
                  {t(translations.management.deadlineExtensions.retry)}
                </Button>
              ) : null}
            </Empty>
          ) : requestsQuery.isLoading ? (
            <LoadingRequests
              label={t(translations.management.deadlineExtensions.loading)}
            />
          ) : requests.length === 0 ? (
            <Empty className="min-h-72 border-border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Clock3 />
                </EmptyMedia>
                <EmptyTitle>
                  {t(translations.management.deadlineExtensions.empty)}
                </EmptyTitle>
                <EmptyDescription>
                  {t(
                    translations.management.deadlineExtensions.emptyDescription,
                  )}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <RequestTable
                dateFormatter={dateFormatter}
                onApprove={setApproveTarget}
                onReject={openReject}
                onSelect={setSelectedRequest}
                requests={requests}
                t={t}
              />
              <RequestCardList
                dateFormatter={dateFormatter}
                onSelect={setSelectedRequest}
                requests={requests}
                t={t}
              />
              <div className="flex flex-col gap-3 border-t border-border/60 px-4 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground">
                  {t(translations.management.deadlineExtensions.pageSummary, {
                    count: requestsQuery.data?.total ?? 0,
                    current: (requestsQuery.data?.page ?? page) + 1,
                    total: requestsQuery.data?.pageCount ?? 1,
                  })}
                </span>
                <div className="flex gap-2">
                  <Button
                    disabled={requestsQuery.isFetching || page <= 0}
                    onClick={() =>
                      setPage((current) => Math.max(0, current - 1))
                    }
                    size="sm"
                    variant="outline"
                  >
                    {t(translations.management.deadlineExtensions.previousPage)}
                  </Button>
                  <Button
                    disabled={
                      requestsQuery.isFetching ||
                      page + 1 >= (requestsQuery.data?.pageCount ?? 1)
                    }
                    onClick={() => setPage((current) => current + 1)}
                    size="sm"
                  >
                    {t(translations.management.deadlineExtensions.nextPage)}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}
        open={selectedRequest !== null}
      >
        <DialogContent className="max-h-[90vh] sm:max-w-xl">
          {selectedRequest ? (
            <RequestDetails
              dateFormatter={dateFormatter}
              onApprove={setApproveTarget}
              onReject={openReject}
              request={selectedRequest}
              t={t}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !approveMutation.isPending) setApproveTarget(null);
        }}
        open={approveTarget !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(translations.management.deadlineExtensions.approveTitle)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approveTarget
                ? t(
                    translations.management.deadlineExtensions
                      .approveDescription,
                    {
                      deadline: approveTarget.projectedDueAt
                        ? dateFormatter.format(
                            new Date(approveTarget.projectedDueAt),
                          )
                        : t(
                            translations.management.deadlineExtensions
                              .noDeadline,
                          ),
                      hours: t(
                        translations.management.deadlineExtensions.hours,
                        {
                          count: approveTarget.requestedHours,
                        },
                      ),
                    },
                  )
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>
              {t(translations.management.deadlineExtensions.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={approveMutation.isPending}
              onClick={submitApproval}
            >
              {approveMutation.isPending ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <Check aria-hidden="true" />
              )}
              {t(translations.management.deadlineExtensions.confirm)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog onOpenChange={closeRejectDialog} open={rejectTarget !== null}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(translations.management.deadlineExtensions.rejectTitle)}
            </DialogTitle>
            <DialogDescription>
              {t(translations.management.deadlineExtensions.rejectDescription)}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitRejection}>
            <div className="space-y-2">
              <Label htmlFor="deadline-extension-reason">
                {t(translations.management.deadlineExtensions.rejectionReason)}
              </Label>
              <Textarea
                id="deadline-extension-reason"
                maxLength={1000}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder={t(
                  translations.management.deadlineExtensions
                    .rejectReasonPlaceholder,
                )}
                rows={5}
                value={rejectionReason}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={rejectMutation.isPending}
                onClick={() => closeRejectDialog(false)}
                type="button"
                variant="outline"
              >
                {t(translations.management.deadlineExtensions.cancel)}
              </Button>
              <Button
                disabled={rejectMutation.isPending}
                type="submit"
                variant="destructive"
              >
                {rejectMutation.isPending ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <X aria-hidden="true" />
                )}
                {t(translations.management.deadlineExtensions.confirmReject)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
