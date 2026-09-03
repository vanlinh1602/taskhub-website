import { format } from 'date-fns';
import {
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  History,
  LoaderCircle,
  ShieldOff,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import DateRangePicker from '@/components/DateRangePicker';
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
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
  usePayPayrollRecipientMutation,
  usePayrollBankQrQuery,
  usePayrollRecipientQuery,
  usePayrollRecipientsQuery,
} from '@/features/payroll/hooks';
import type {
  PayrollRecipient,
  PayrollStatus,
  PayrollSummary,
  PayrollTask,
  PayrollTotals,
} from '@/features/payroll/types';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

const PAGE_SIZE = 25;
const PAYROLL_STATUSES: readonly PayrollStatus[] = ['PENDING', 'PAID'];

function isForbiddenError(error: unknown): boolean {
  if (!error) return false;
  const message = formatError(error).toLocaleLowerCase();
  return (
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('quyền')
  );
}

function formatTotals(
  totals: readonly PayrollTotals[],
  language: string,
): string {
  if (!totals.length) return '—';
  return totals
    .map(
      (item) =>
        `${new Intl.NumberFormat(language, {
          maximumFractionDigits: 2,
        }).format(item.total)} ${item.currency}`,
    )
    .join(' · ');
}

function formatMoney(
  value: string,
  currency: string,
  language: string,
): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${new Intl.NumberFormat(language, {
    maximumFractionDigits: 2,
  }).format(amount)} ${currency}`;
}

function formatDate(
  value: string | null,
  formatter: Intl.DateTimeFormat,
  noDateLabel: string,
  invalidDateLabel: string,
): string {
  if (!value) return noDateLabel;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? invalidDateLabel
    : formatter.format(date);
}

function getStatusLabel(
  status: PayrollStatus,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  return status === 'PENDING'
    ? t(translations.management.payroll.pendingStatus)
    : t(translations.management.payroll.paidStatus);
}

function getStatusClassName(status: PayrollStatus): string {
  return status === 'PENDING'
    ? 'bg-primary/10 text-primary'
    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
}

function PayrollStatusBadge({
  status,
  t,
}: {
  readonly status: PayrollStatus;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClassName(status)}`}
    >
      {getStatusLabel(status, t)}
    </span>
  );
}

function MemberValue({
  recipient,
}: {
  readonly recipient: PayrollRecipient;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {recipient.avatarUrl ? (
        <img
          alt=""
          className="size-9 shrink-0 rounded-xl border border-border/70 object-cover"
          src={recipient.avatarUrl}
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserRound aria-hidden="true" className="size-4" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold" title={recipient.displayName}>
          {recipient.displayName}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {recipient.discordUserId}
        </p>
      </div>
    </div>
  );
}

function LoadingRecipients({ label }: { readonly label: string }) {
  return (
    <div aria-label={label} className="space-y-3" role="status">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton className="h-16 w-full" key={index} />
      ))}
    </div>
  );
}

function PayrollTable({
  dateFormatter,
  language,
  onSelect,
  recipients,
  status,
  t,
}: {
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly language: string;
  readonly onSelect: (recipient: PayrollRecipient) => void;
  readonly recipients: readonly PayrollRecipient[];
  readonly status: PayrollStatus;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <Table className="min-w-[960px]">
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead>{t(translations.management.payroll.member)}</TableHead>
            <TableHead>{t(translations.management.payroll.taskCount)}</TableHead>
            <TableHead>{t(translations.management.payroll.baseSalary)}</TableHead>
            <TableHead>{t(translations.management.payroll.reward)}</TableHead>
            <TableHead>{t(translations.management.payroll.grandTotal)}</TableHead>
            <TableHead>{t(translations.management.payroll.status)}</TableHead>
            <TableHead className="text-right">
              {t(translations.management.payroll.viewDetails)}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipients.map((recipient) => (
            <TableRow key={recipient.discordUserId}>
              <TableCell>
                <MemberValue recipient={recipient} />
              </TableCell>
              <TableCell className="font-semibold tabular-nums">
                {recipient.taskCount}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatTotals(recipient.baseTotals, language)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatTotals(
                  recipient.rewardTotal
                    ? [{ currency: 'VND', total: recipient.rewardTotal }]
                    : [],
                  language,
                )}
              </TableCell>
              <TableCell className="font-bold whitespace-nowrap">
                {formatTotals(recipient.grandTotals, language)}
              </TableCell>
              <TableCell>
                <div className="space-y-1.5">
                  <PayrollStatusBadge status={status} t={t} />
                  {status === 'PAID' ? (
                    <time
                      className="block text-xs text-muted-foreground"
                      dateTime={recipient.latestPaidAt ?? undefined}
                      title={recipient.latestPaidAt ?? undefined}
                    >
                      {formatDate(
                        recipient.latestPaidAt,
                        dateFormatter,
                        t(translations.management.payroll.noDate),
                        t(translations.management.payroll.invalidDate),
                      )}
                    </time>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  onClick={() => onSelect(recipient)}
                  size="sm"
                  variant="outline"
                >
                  <FileText aria-hidden="true" />
                  {t(translations.management.payroll.viewDetails)}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PayrollCardList({
  dateFormatter,
  language,
  onSelect,
  recipients,
  status,
  t,
}: {
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly language: string;
  readonly onSelect: (recipient: PayrollRecipient) => void;
  readonly recipients: readonly PayrollRecipient[];
  readonly status: PayrollStatus;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="grid gap-3 lg:hidden">
      {recipients.map((recipient) => (
        <article
          className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"
          key={recipient.discordUserId}
        >
          <div className="flex items-start justify-between gap-3">
            <MemberValue recipient={recipient} />
            <PayrollStatusBadge status={status} t={t} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">
                {t(translations.management.payroll.taskCount)}
              </p>
              <p className="mt-1 font-semibold tabular-nums">
                {recipient.taskCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t(translations.management.payroll.baseSalary)}
              </p>
              <p className="mt-1 font-semibold">
                {formatTotals(recipient.baseTotals, language)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t(translations.management.payroll.reward)}
              </p>
              <p className="mt-1 font-semibold">
                {formatTotals(
                  recipient.rewardTotal
                    ? [{ currency: 'VND', total: recipient.rewardTotal }]
                    : [],
                  language,
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t(translations.management.payroll.grandTotal)}
              </p>
              <p className="mt-1 font-bold">
                {formatTotals(recipient.grandTotals, language)}
              </p>
            </div>
          </div>
          {status === 'PAID' ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {t(translations.management.payroll.paidAt)}:{' '}
              {formatDate(
                recipient.latestPaidAt,
                dateFormatter,
                t(translations.management.payroll.noDate),
                t(translations.management.payroll.invalidDate),
              )}
            </p>
          ) : null}
          <Button
            className="mt-4 w-full"
            onClick={() => onSelect(recipient)}
            variant="outline"
          >
            <FileText aria-hidden="true" />
            {t(translations.management.payroll.viewDetails)}
          </Button>
        </article>
      ))}
    </div>
  );
}

function DetailTaskTable({
  dateFormatter,
  language,
  tasks,
  t,
}: {
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly language: string;
  readonly tasks: readonly PayrollTask[];
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="w-[34%]">
              {t(translations.management.payroll.storyChapterStage)}
            </TableHead>
            <TableHead>{t(translations.management.payroll.baseSalary)}</TableHead>
            <TableHead>{t(translations.management.payroll.reward)}</TableHead>
            <TableHead>{t(translations.management.payroll.completedAt)}</TableHead>
            <TableHead>{t(translations.management.payroll.paymentInfo)}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow className="align-top" key={task.id}>
              <TableCell className="align-top">
                <div className="max-w-[300px] space-y-1">
                  <p className="font-semibold break-words" title={task.storyTitle}>
                    {task.storyTitle}
                  </p>
                  <p className="text-xs break-words text-muted-foreground">
                    {task.chapterName}
                  </p>
                  <p className="text-xs break-words text-muted-foreground">
                    {task.stageName} · {task.stageCode}
                  </p>
                </div>
              </TableCell>
              <TableCell className="align-top whitespace-nowrap">
                {formatMoney(task.agreedPrice, task.currency, language)}
              </TableCell>
              <TableCell className="align-top whitespace-nowrap">
                {Number(task.rewardAmount) > 0
                  ? formatMoney(task.rewardAmount, task.currency, language)
                  : '—'}
              </TableCell>
              <TableCell className="align-top text-xs whitespace-nowrap">
                {formatDate(
                  task.completedAt,
                  dateFormatter,
                  t(translations.management.payroll.noDate),
                  t(translations.management.payroll.invalidDate),
                )}
              </TableCell>
              <TableCell className="align-top">
                <div className="min-w-[180px] space-y-1.5 text-xs">
                  <PayrollStatusBadge status={task.paymentStatus} t={t} />
                  {task.paidAt ? (
                    <p className="text-muted-foreground">
                      {t(translations.management.payroll.paidAt)}:{' '}
                      {formatDate(
                        task.paidAt,
                        dateFormatter,
                        t(translations.management.payroll.noDate),
                        t(translations.management.payroll.invalidDate),
                      )}
                    </p>
                  ) : null}
                  {task.paidByDiscordUserId ? (
                    <p className="break-all text-muted-foreground">
                      {t(translations.management.payroll.paidBy)}:{' '}
                      {task.paidByDiscordUserId}
                    </p>
                  ) : null}
                  <p className="break-all text-muted-foreground">
                    {t(translations.management.payroll.paymentReference)}:{' '}
                    {task.paymentReference ??
                      t(translations.management.payroll.noPaymentReference)}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DetailSkeleton({ label }: { readonly label: string }) {
  return (
    <div aria-label={label} className="space-y-4" role="status">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/25 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-bold" title={value}>
        {value}
      </p>
    </div>
  );
}

function PayrollDetailPanel({
  bankQrUrl,
  dateFormatter,
  detail,
  detailError,
  detailPage,
  detailPageCount,
  status,
  isBankQrError,
  isBankQrLoading,
  isPending,
  language,
  onMarkPaid,
  onNextPage,
  onPreviousPage,
  t,
}: {
  readonly bankQrUrl: string | null;
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly detail: {
    readonly recipient: PayrollRecipient;
    readonly bankQr: { readonly configured: boolean; readonly fileName: string | null };
    readonly tasks: readonly PayrollTask[];
  } | null;
  readonly detailError: Error | null;
  readonly detailPage: number;
  readonly detailPageCount: number;
  readonly status: PayrollStatus;
  readonly isBankQrError: boolean;
  readonly isBankQrLoading: boolean;
  readonly isPending: boolean;
  readonly language: string;
  readonly onMarkPaid: () => void;
  readonly onNextPage: () => void;
  readonly onPreviousPage: () => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  if (detailError) {
    return (
      <div className="space-y-4">
        <SheetHeader className="p-0">
          <SheetTitle>
            {isForbiddenError(detailError)
              ? t(translations.management.payroll.forbidden)
              : t(translations.management.payroll.error)}
          </SheetTitle>
          <SheetDescription>{formatError(detailError)}</SheetDescription>
        </SheetHeader>
        <Empty className="min-h-72 border border-destructive/20 bg-destructive/5">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldOff />
            </EmptyMedia>
            <EmptyTitle>{t(translations.management.payroll.detailTitle)}</EmptyTitle>
            <EmptyDescription>
              {isForbiddenError(detailError)
                ? t(translations.management.payroll.forbidden)
                : t(translations.management.payroll.error)}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (!detail) return null;
  const { recipient } = detail;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="border-b border-border/60 p-0 pb-5">
        <div className="flex items-start gap-3 pr-8">
          {recipient.avatarUrl ? (
            <img
              alt=""
              className="size-11 shrink-0 rounded-2xl border border-border/70 object-cover"
              src={recipient.avatarUrl}
            />
          ) : (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <SheetTitle className="truncate text-lg" title={recipient.displayName}>
              {recipient.displayName}
            </SheetTitle>
            <SheetDescription className="truncate font-mono">
              {recipient.discordUserId}
            </SheetDescription>
          </div>
        </div>
        <div className="mt-4">
          <PayrollStatusBadge status={status} t={t} />
        </div>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-5">
        <div className="grid grid-cols-2 gap-2">
          <SummaryMetric
            label={t(translations.management.payroll.taskCount)}
            value={String(recipient.taskCount)}
          />
          <SummaryMetric
            label={t(translations.management.payroll.baseSalary)}
            value={formatTotals(recipient.baseTotals, language)}
          />
          <SummaryMetric
            label={t(translations.management.payroll.reward)}
            value={formatTotals(
              recipient.rewardTotal
                ? [{ currency: 'VND', total: recipient.rewardTotal }]
                : [],
              language,
            )}
          />
          <SummaryMetric
            label={t(translations.management.payroll.grandTotal)}
            value={formatTotals(recipient.grandTotals, language)}
          />
        </div>

        {recipient.rewardRate !== null && recipient.nextThreshold !== null ? (
          <p className="rounded-xl bg-primary/5 px-3 py-2 text-xs leading-5 text-muted-foreground">
            {recipient.rewardRate > 0
              ? `${formatMoney(String(recipient.rewardRate), 'VND', language)} / task`
              : t(translations.management.payroll.reward)}{' '}
            · {recipient.nextThreshold - recipient.rewardEligibleTaskCount}{' '}
            {t(translations.management.payroll.pendingTasks)}
          </p>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">
                {t(translations.management.payroll.bankQr)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {detail.bankQr.fileName ??
                  t(translations.management.payroll.bankQrMissing)}
              </p>
            </div>
            <Banknote aria-hidden="true" className="size-5 text-primary" />
          </div>
          {detail.bankQr.configured ? (
            isBankQrLoading ? (
              <Skeleton className="mx-auto h-48 w-48 rounded-xl" />
            ) : isBankQrError ? (
              <p className="rounded-xl bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {t(translations.management.payroll.bankQrError)}
              </p>
            ) : bankQrUrl ? (
              <div className="flex justify-center rounded-xl border border-border/70 bg-white p-3">
                <img
                  alt={t(translations.management.payroll.bankQr)}
                  className="max-h-52 w-auto object-contain"
                  src={bankQrUrl}
                />
              </div>
            ) : null
          ) : (
            <p className="rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {t(translations.management.payroll.bankQrMissing)}
            </p>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText aria-hidden="true" className="size-4 text-primary" />
            <h3 className="font-semibold">
              {t(translations.management.payroll.taskDetails)}
            </h3>
          </div>
          {detail.tasks.length ? (
            <DetailTaskTable
              dateFormatter={dateFormatter}
              language={language}
              tasks={detail.tasks}
              t={t}
            />
          ) : (
            <p className="rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {t(translations.management.payroll.emptyPending)}
            </p>
          )}
        </section>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {t(translations.management.payroll.taskPageSummary, {
              count: recipient.taskCount,
              current: detailPage + 1,
              total: detailPageCount,
            })}
          </span>
          <div className="flex gap-1">
            <Button
              aria-label={t(translations.management.payroll.previousPage)}
              disabled={isPending || detailPage <= 0}
              onClick={onPreviousPage}
              size="icon-sm"
              variant="outline"
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              aria-label={t(translations.management.payroll.nextPage)}
              disabled={isPending || detailPage + 1 >= detailPageCount}
              onClick={onNextPage}
              size="icon-sm"
              variant="outline"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
        {status === 'PENDING' ? (
          <Button disabled={isPending} onClick={onMarkPaid} className="w-full">
            {isPending ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <Check aria-hidden="true" />
            )}
            {t(translations.management.payroll.markPaid)}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function PayrollPage() {
  const { t, i18n } = useTranslation();
  const { activeWorkspaceId } = useWorkspaceStore();
  const [status, setStatus] = useState<PayrollStatus>('PENDING');
  const [page, setPage] = useState(0);
  const [detailPage, setDetailPage] = useState(0);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(
    null,
  );
  const [confirmRecipient, setConfirmRecipient] =
    useState<PayrollRecipient | null>(null);
  const [bankQrUrl, setBankQrUrl] = useState<string | null>(null);
  const [paidDateRange, setPaidDateRange] = useState<DateRange | undefined>();
  const language = i18n.language;
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(language, { dateStyle: 'medium' }),
    [language],
  );
  const paidDateQuery = useMemo(() => {
    if (status !== 'PAID' || !paidDateRange?.from || !paidDateRange.to)
      return {};
    return {
      from: format(paidDateRange.from, 'yyyy-MM-dd'),
      to: format(paidDateRange.to, 'yyyy-MM-dd'),
    };
  }, [paidDateRange, status]);
  const activeQuery = usePayrollRecipientsQuery(activeWorkspaceId, {
    status,
    page,
    pageSize: PAGE_SIZE,
    ...paidDateQuery,
  });
  const pendingQuery = usePayrollRecipientsQuery(activeWorkspaceId, {
    status: 'PENDING',
    page: 0,
    pageSize: PAGE_SIZE,
  });
  const detailQuery = usePayrollRecipientQuery(
    activeWorkspaceId,
    selectedRecipient ?? '',
    { status, page: detailPage, pageSize: PAGE_SIZE, ...paidDateQuery },
  );
  const bankQrQuery = usePayrollBankQrQuery(
    activeWorkspaceId,
    selectedRecipient ?? '',
    Boolean(detailQuery.data?.bankQr.configured),
  );
  const payMutation = usePayPayrollRecipientMutation(activeWorkspaceId);
  const pendingSummary: PayrollSummary | undefined = pendingQuery.data?.summary;
  const recipients = activeQuery.data?.items ?? [];
  const selectedRecipientValue: PayrollRecipient | undefined =
    recipients.find((recipient) => recipient.discordUserId === selectedRecipient) ??
    confirmRecipient ??
    undefined;

  useEffect(() => {
    if (!bankQrQuery.data) {
      setBankQrUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(bankQrQuery.data);
    setBankQrUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [bankQrQuery.data]);

  function handleStatusChange(nextStatus: PayrollStatus): void {
    setStatus(nextStatus);
    setPage(0);
    setDetailPage(0);
    setSelectedRecipient(null);
    setConfirmRecipient(null);
  }

  function handleSelectRecipient(recipient: PayrollRecipient): void {
    setSelectedRecipient(recipient.discordUserId);
    setDetailPage(0);
  }

  function handlePaidDateRangeChange(range: DateRange | undefined): void {
    setPaidDateRange(range);
    setPage(0);
    setDetailPage(0);
    setSelectedRecipient(null);
    setConfirmRecipient(null);
  }

  useEffect(() => {
    setPage(0);
    setDetailPage(0);
    setSelectedRecipient(null);
    setConfirmRecipient(null);
    setPaidDateRange(undefined);
  }, [activeWorkspaceId]);

  function handleRequestPayment(): void {
    if (selectedRecipientValue && selectedRecipientValue.latestPaidAt === null)
      setConfirmRecipient(selectedRecipientValue);
  }

  function handleSubmitPayment(): void {
    if (!confirmRecipient) return;
    const memberName = confirmRecipient.displayName;
    payMutation.mutate(confirmRecipient.discordUserId, {
      onSuccess: (result) => {
        setConfirmRecipient(null);
        setSelectedRecipient(null);
        toast.success(t(translations.management.payroll.paymentSuccess), {
          description: t(
            translations.management.payroll.paymentSuccessDescription,
            { count: result.taskCount, member: memberName },
          ),
        });
      },
      onError: (error) => {
        toast.error(t(translations.management.payroll.paymentFailed), {
          description: formatError(error),
        });
      },
    });
  }

  if (!activeWorkspaceId) {
    return (
      <section className="space-y-6">
        <PageIntro t={t} />
        <Empty className="min-h-80 border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleDollarSign />
            </EmptyMedia>
            <EmptyTitle>{t(translations.management.payroll.noWorkspace)}</EmptyTitle>
            <EmptyDescription>
              {t(translations.management.payroll.noWorkspaceDescription)}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </section>
    );
  }

  const activeError = activeQuery.error;
  const showError = Boolean(activeError);
  const showLoading = activeQuery.isLoading;
  const showEmpty = !showLoading && !showError && recipients.length === 0;

  return (
    <section className="space-y-6">
      <PageIntro t={t} />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          icon={<FileText aria-hidden="true" />}
          label={t(translations.management.payroll.pendingTasks)}
          value={String(pendingSummary?.taskCount ?? '—')}
        />
        <StatCard
          icon={<UsersRound aria-hidden="true" />}
          label={t(translations.management.payroll.pendingMembers)}
          value={String(pendingQuery.data?.total ?? '—')}
        />
        <StatCard
          icon={<Banknote aria-hidden="true" />}
          label={t(translations.management.payroll.pendingTotal)}
          value={formatTotals(pendingSummary?.grandTotals ?? [], language)}
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/60 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>{t(translations.management.payroll.title)}</CardTitle>
            <CardDescription>
              {t(translations.management.payroll.pageDescription)}
            </CardDescription>
          </div>
          <div
            aria-label={t(translations.management.payroll.status)}
            className="flex w-full rounded-xl border border-border/70 bg-muted/30 p-1 sm:w-auto"
            role="tablist"
          >
            {PAYROLL_STATUSES.map((item) => (
              <Button
                aria-selected={status === item}
                className="flex-1 rounded-lg sm:flex-none"
                key={item}
                onClick={() => handleStatusChange(item)}
                role="tab"
                variant={status === item ? 'default' : 'ghost'}
              >
                {item === 'PENDING' ? (
                  <Clock3 aria-hidden="true" />
                ) : (
                  <History aria-hidden="true" />
                )}
                {item === 'PENDING'
                  ? t(translations.management.payroll.pendingTab)
                  : t(translations.management.payroll.paidTab)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {status === 'PAID' ? (
            <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/15 p-4 sm:flex-row sm:items-end sm:p-6">
              <div className="min-w-0 space-y-1.5 sm:w-80">
                <Label className="text-xs font-semibold text-foreground/75">
                  {t(translations.management.payroll.paidDateRange)}
                </Label>
                <DateRangePicker
                  label={t(translations.management.payroll.paidDateRange)}
                  onChange={handlePaidDateRangeChange}
                  placeholder={t(translations.management.payroll.allDates)}
                  value={paidDateRange}
                />
              </div>
              {paidDateRange?.from ? (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => handlePaidDateRangeChange(undefined)}
                  variant="ghost"
                >
                  <X aria-hidden="true" />
                  {t(translations.management.payroll.clearDateRange)}
                </Button>
              ) : null}
            </div>
          ) : null}
          {showError ? (
            <Empty className="min-h-72 border-0 bg-destructive/5">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldOff />
                </EmptyMedia>
                <EmptyTitle>
                  {isForbiddenError(activeError)
                    ? t(translations.management.payroll.forbidden)
                    : t(translations.management.payroll.error)}
                </EmptyTitle>
                <EmptyDescription>
                  {isForbiddenError(activeError)
                    ? t(translations.management.payroll.forbidden)
                    : formatError(activeError)}
                </EmptyDescription>
              </EmptyHeader>
              {!isForbiddenError(activeError) ? (
                <Button onClick={() => void activeQuery.refetch()} variant="outline">
                  {t(translations.management.payroll.retry)}
                </Button>
              ) : null}
            </Empty>
          ) : showLoading ? (
            <div className="p-4 sm:p-6">
              <LoadingRecipients label={t(translations.management.payroll.loading)} />
            </div>
          ) : showEmpty ? (
            <Empty className="min-h-72 border-0 bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  {status === 'PENDING' ? <Clock3 /> : <History />}
                </EmptyMedia>
                <EmptyTitle>
                  {status === 'PENDING'
                    ? t(translations.management.payroll.emptyPending)
                    : paidDateRange?.from && paidDateRange.to
                      ? t(translations.management.payroll.emptyPaidFiltered)
                      : t(translations.management.payroll.emptyPaid)}
                </EmptyTitle>
                <EmptyDescription>
                  {status === 'PENDING'
                    ? t(translations.management.payroll.emptyPendingDescription)
                    : paidDateRange?.from && paidDateRange.to
                      ? t(
                          translations.management.payroll
                            .emptyPaidFilteredDescription,
                        )
                      : t(translations.management.payroll.emptyPaidDescription)}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="p-4 pb-0 sm:p-6 sm:pb-0">
                <PayrollTable
                  dateFormatter={dateFormatter}
                  language={language}
                  onSelect={handleSelectRecipient}
                  recipients={recipients}
                  status={status}
                  t={t}
                />
                <PayrollCardList
                  dateFormatter={dateFormatter}
                  language={language}
                  onSelect={handleSelectRecipient}
                  recipients={recipients}
                  status={status}
                  t={t}
                />
              </div>
              <div className="mt-4 flex flex-col gap-3 border-t border-border/60 px-4 pt-4 pb-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <span className="text-muted-foreground">
                  {t(translations.management.payroll.pageSummary, {
                    count: activeQuery.data?.total ?? 0,
                    current: (activeQuery.data?.page ?? page) + 1,
                    total: activeQuery.data?.pageCount ?? 1,
                  })}
                </span>
                <div className="flex gap-2">
                  <Button
                    disabled={activeQuery.isFetching || page <= 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronLeft aria-hidden="true" />
                    {t(translations.management.payroll.previousPage)}
                  </Button>
                  <Button
                    disabled={
                      activeQuery.isFetching ||
                      page + 1 >= (activeQuery.data?.pageCount ?? 1)
                    }
                    onClick={() => setPage((current) => current + 1)}
                    size="sm"
                  >
                    {t(translations.management.payroll.nextPage)}
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRecipient(null);
            setDetailPage(0);
          }
        }}
        open={selectedRecipient !== null}
      >
        <SheetContent className="overflow-hidden p-4 data-[side=right]:!w-full sm:!max-w-4xl sm:p-6">
          {detailQuery.isLoading ? (
            <>
              <SheetHeader className="p-0">
                <SheetTitle>
                  {t(translations.management.payroll.detailTitle)}
                </SheetTitle>
                <SheetDescription>
                  {t(translations.management.payroll.detailDescription)}
                </SheetDescription>
              </SheetHeader>
              <DetailSkeleton
                label={t(translations.management.payroll.loading)}
              />
            </>
          ) : (
            <PayrollDetailPanel
              bankQrUrl={bankQrUrl}
              dateFormatter={dateFormatter}
              detail={detailQuery.data ?? null}
              detailError={detailQuery.error}
              detailPage={detailQuery.data?.page ?? detailPage}
              detailPageCount={detailQuery.data?.pageCount ?? 1}
              isBankQrError={bankQrQuery.isError}
              isBankQrLoading={bankQrQuery.isLoading}
              isPending={payMutation.isPending}
              language={language}
              onMarkPaid={handleRequestPayment}
              onNextPage={() => setDetailPage((current) => current + 1)}
              onPreviousPage={() =>
                setDetailPage((current) => Math.max(0, current - 1))
              }
              status={status}
              t={t}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !payMutation.isPending) setConfirmRecipient(null);
        }}
        open={confirmRecipient !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(translations.management.payroll.confirmTitle)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRecipient
                ? t(translations.management.payroll.confirmDescription, {
                    count: confirmRecipient.taskCount,
                    member: confirmRecipient.displayName,
                  })
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl bg-muted/40 px-3 py-3 text-sm">
            <p className="font-semibold">
              {confirmRecipient
                ? formatTotals(confirmRecipient.grandTotals, language)
                : '—'}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={payMutation.isPending}>
              {t(translations.management.payroll.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={payMutation.isPending}
              onClick={handleSubmitPayment}
            >
              {payMutation.isPending ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <Check aria-hidden="true" />
              )}
              {t(translations.management.payroll.confirmAction)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function PageIntro({
  t,
}: {
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight">
        {t(translations.management.payroll.title)}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {t(translations.management.payroll.pageDescription)}
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-lg font-extrabold tabular-nums" title={value}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
