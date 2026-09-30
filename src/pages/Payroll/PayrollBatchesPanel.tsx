import {
  Banknote,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  Save,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useWorkspacesQuery } from '@/features/admin/hooks';
import {
  useCancelPayrollBatchMutation,
  useCreatePayrollBatchMutation,
  usePayPayrollBatchRecipientMutation,
  usePayrollBatchesQuery,
  usePayrollBatchQuery,
  useUpdatePayrollBatchTaskPriceMutation,
} from '@/features/payroll/hooks';
import type {
  PayrollBatchRecipient,
  PayrollBatchStatus,
  PayrollBatchSummary,
  PayrollBatchTask,
} from '@/features/payroll/types';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

const BATCH_PAGE_SIZE = 25;
const FALLBACK_TIMEZONE = 'Asia/Ho_Chi_Minh';

interface PayrollBatchesPanelProps {
  readonly mode: 'pending' | 'history';
  readonly workspaceId: string;
}

export default function PayrollBatchesPanel({
  mode,
  workspaceId,
}: PayrollBatchesPanelProps) {
  const { t, i18n } = useTranslation();
  const workspacesQuery = useWorkspacesQuery();
  const timezone =
    workspacesQuery.data?.find((workspace) => workspace.id === workspaceId)
      ?.timezone ?? FALLBACK_TIMEZONE;
  const batchesQuery = usePayrollBatchesQuery(workspaceId);
  const createBatchMutation = useCreatePayrollBatchMutation(workspaceId);
  const cancelBatchMutation = useCancelPayrollBatchMutation(workspaceId);
  const [cutoffValue, setCutoffValue] = useState('');
  const [cutoffTouched, setCutoffTouched] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState(0);
  const [payRecipient, setPayRecipient] = useState<PayrollBatchRecipient | null>(null);
  const [cancelBatch, setCancelBatch] = useState<PayrollBatchSummary | null>(null);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: timezone,
      }),
    [i18n.language, timezone],
  );
  const workspaceNowValue = getWorkspaceDateTimeLocal(new Date(), timezone);
  const effectiveCutoffValue = cutoffValue || workspaceNowValue;
  const batchQuery = usePayrollBatchQuery(
    workspaceId,
    selectedBatchId ?? '',
    {
      recipientDiscordUserId: selectedRecipientId ?? undefined,
      page: detailPage,
      pageSize: BATCH_PAGE_SIZE,
    },
    selectedBatchId !== null,
  );
  const payMutation = usePayPayrollBatchRecipientMutation(
    workspaceId,
    selectedBatchId ?? '',
  );
  const priceMutation = useUpdatePayrollBatchTaskPriceMutation(
    workspaceId,
    selectedBatchId ?? '',
  );
  const visibleBatches = (batchesQuery.data ?? []).filter((batch) =>
    mode === 'pending'
      ? batch.status === 'OPEN' || batch.status === 'PARTIALLY_PAID'
      : batch.status === 'PAID',
  );
  const selectedRecipient =
    batchQuery.data?.recipients.find(
      (recipient) => recipient.discordUserId === selectedRecipientId,
    ) ?? null;

  useEffect(() => {
    if (!cutoffTouched) setCutoffValue(getWorkspaceDateTimeLocal(new Date(), timezone));
  }, [cutoffTouched, timezone]);

  useEffect(() => {
    setSelectedBatchId(null);
    setSelectedRecipientId(null);
    setDetailPage(0);
    setDraftPrices({});
    setPayRecipient(null);
    setCancelBatch(null);
    setCutoffTouched(false);
  }, [mode, workspaceId]);

  function closeBatchDetails(): void {
    setSelectedBatchId(null);
    setSelectedRecipientId(null);
    setDetailPage(0);
    setDraftPrices({});
  }

  function handleCreateBatch(): void {
    const cutoffAt = workspaceDateTimeToUtc(effectiveCutoffValue, timezone);
    if (!cutoffAt) {
      toast.error(t(translations.management.payroll.batchInvalidCutoff));
      return;
    }
    if (cutoffAt.getTime() > Date.now()) {
      toast.error(t(translations.management.payroll.batchFutureCutoff));
      return;
    }
    createBatchMutation.mutate(cutoffAt.toISOString(), {
      onSuccess: (batch) => {
        setCutoffTouched(false);
        setSelectedBatchId(String(batch.id));
        setSelectedRecipientId(null);
        setDetailPage(0);
        toast.success(
          t(translations.management.payroll.batchCreated, {
            count: batch.taskCount,
          }),
        );
      },
      onError: (error) => {
        toast.error(t(translations.management.payroll.batchCreateFailed), {
          description: formatError(error),
        });
      },
    });
  }

  function handlePayRecipient(): void {
    if (!payRecipient || !selectedBatchId) return;
    payMutation.mutate(payRecipient.discordUserId, {
      onSuccess: (result) => {
        setPayRecipient(null);
        toast.success(
          t(translations.management.payroll.batchPaymentSuccess, {
            member: payRecipient.displayName,
          }),
          {
            description: formatTotals(result.grandTotals, i18n.language),
          },
        );
      },
      onError: (error) => {
        toast.error(t(translations.management.payroll.paymentFailed), {
          description: formatError(error),
        });
      },
    });
  }

  function handleCancelBatch(): void {
    if (!cancelBatch) return;
    cancelBatchMutation.mutate(cancelBatch.id, {
      onSuccess: () => {
        setCancelBatch(null);
        closeBatchDetails();
        toast.success(t(translations.management.payroll.batchCancelled));
      },
      onError: (error) => {
        toast.error(t(translations.management.payroll.batchCancelFailed), {
          description: formatError(error),
        });
      },
    });
  }

  function handleSavePrice(task: PayrollBatchTask): void {
    const agreedPrice = draftPrices[task.id] ?? task.agreedPrice;
    if (!selectedBatchId) return;
    priceMutation.mutate(
      { taskId: task.id, agreedPrice },
      {
        onSuccess: () => {
          setDraftPrices((current) => {
            const next = { ...current };
            delete next[task.id];
            return next;
          });
          toast.success(t(translations.management.payroll.batchPriceSaved));
        },
        onError: (error) => {
          toast.error(t(translations.management.payroll.batchPriceFailed), {
            description: formatError(error),
          });
        },
      },
    );
  }

  const statusLabel = (status: PayrollBatchStatus): string => {
    if (status === 'PAID')
      return t(translations.management.payroll.batchStatusPaid);
    if (status === 'PARTIALLY_PAID')
      return t(translations.management.payroll.batchStatusPartial);
    if (status === 'CANCELLED')
      return t(translations.management.payroll.batchStatusCancelled);
    return t(translations.management.payroll.batchStatusOpen);
  };

  const statusClassName = (status: PayrollBatchStatus): string => {
    if (status === 'PAID') return 'bg-accent text-accent-foreground';
    if (status === 'PARTIALLY_PAID')
      return 'bg-secondary text-secondary-foreground';
    if (status === 'CANCELLED') return 'bg-muted text-muted-foreground';
    return 'bg-primary/10 text-primary';
  };

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm shadow-black/5">
        <CardHeader className="gap-2 border-b border-border/60 bg-card sm:flex sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock aria-hidden="true" className="size-5 text-primary" />
              {mode === 'pending'
                ? t(translations.management.payroll.batchesPendingTitle)
                : t(translations.management.payroll.batchesHistoryTitle)}
            </CardTitle>
            <CardDescription className="mt-1">
              {mode === 'pending'
                ? t(translations.management.payroll.batchesPendingDescription)
                : t(translations.management.payroll.batchesHistoryDescription)}
            </CardDescription>
          </div>
          {mode === 'pending' ? (
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[26rem] sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor="payroll-cutoff">
                  {t(translations.management.payroll.batchCutoff)}
                </Label>
                <Input
                  id="payroll-cutoff"
                  max={workspaceNowValue}
                  onChange={(event) => {
                    setCutoffValue(event.target.value);
                    setCutoffTouched(true);
                  }}
                  type="datetime-local"
                  value={effectiveCutoffValue}
                />
                <p className="text-xs text-muted-foreground">
                  {t(translations.management.payroll.batchTimezone, {
                    timezone,
                  })}
                </p>
              </div>
              <Button
                className="shrink-0"
                disabled={createBatchMutation.isPending}
                onClick={handleCreateBatch}
              >
                {createBatchMutation.isPending ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Check aria-hidden="true" />
                )}
                {t(translations.management.payroll.closePayroll)}
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          {batchesQuery.isError ? (
            <div className="p-5 text-sm text-destructive">
              {formatError(batchesQuery.error)}
            </div>
          ) : batchesQuery.isLoading ? (
            <div className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              {t(translations.management.payroll.loading)}
            </div>
          ) : visibleBatches.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              {mode === 'pending'
                ? t(translations.management.payroll.noOpenBatches)
                : t(translations.management.payroll.noPaidBatches)}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <Table className="min-w-[880px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t(translations.management.payroll.batchCutoff)}</TableHead>
                      <TableHead>{t(translations.management.payroll.taskCount)}</TableHead>
                      <TableHead>{t(translations.management.payroll.batchMembers)}</TableHead>
                      <TableHead>{t(translations.management.payroll.status)}</TableHead>
                      <TableHead className="text-right">
                        {t(translations.management.payroll.grandTotal)}
                      </TableHead>
                      <TableHead className="text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {dateTimeFormatter.format(new Date(batch.cutoffAt))}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {batch.taskCount}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {mode === 'history'
                            ? `${batch.paidRecipientCount} / ${batch.recipientCount}`
                            : batch.recipientCount}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName(batch.status)}`}
                          >
                            {statusLabel(batch.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap tabular-nums">
                          {formatTotals(batch.grandTotals, i18n.language)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => {
                              setSelectedBatchId(String(batch.id));
                              setSelectedRecipientId(null);
                              setDetailPage(0);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <Eye aria-hidden="true" />
                            {t(translations.management.payroll.viewDetails)}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ul className="divide-y divide-border/60 px-4 lg:hidden">
                {visibleBatches.map((batch) => (
                  <li className="py-4 first:pt-5 last:pb-5" key={batch.id}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold">
                        {dateTimeFormatter.format(new Date(batch.cutoffAt))}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName(batch.status)}`}
                      >
                        {statusLabel(batch.status)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t(translations.management.payroll.taskCount)}
                        </p>
                        <p className="mt-1 font-medium tabular-nums">
                          {batch.taskCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t(translations.management.payroll.batchMembers)}
                        </p>
                        <p className="mt-1 font-medium tabular-nums">
                          {mode === 'history'
                            ? `${batch.paidRecipientCount} / ${batch.recipientCount}`
                            : batch.recipientCount}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">
                          {t(translations.management.payroll.grandTotal)}
                        </p>
                        <p className="mt-1 font-semibold break-words tabular-nums">
                          {formatTotals(batch.grandTotals, i18n.language)}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="mt-3 w-full"
                      onClick={() => {
                        setSelectedBatchId(String(batch.id));
                        setSelectedRecipientId(null);
                        setDetailPage(0);
                      }}
                      variant="outline"
                    >
                      <Eye aria-hidden="true" />
                      {t(translations.management.payroll.viewDetails)}
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet
        onOpenChange={(open) => {
          if (!open) closeBatchDetails();
        }}
        open={selectedBatchId !== null}
      >
        <SheetContent className="flex h-full min-h-0 flex-col gap-0 overflow-hidden p-4 pt-14 data-[side=right]:!w-full sm:!max-w-6xl sm:p-6 sm:pt-6">
          {batchQuery.isLoading || !batchQuery.data ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
              {batchQuery.isLoading ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : null}
              {batchQuery.isError
                ? formatError(batchQuery.error)
                : batchQuery.isLoading
                  ? t(translations.management.payroll.loading)
                  : t(translations.management.payroll.batchDetailUnavailable)}
            </div>
          ) : (
            <>
              <SheetHeader className="shrink-0 space-y-2 p-0 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3 pr-7">
                  <div>
                    <SheetTitle>
                      {t(translations.management.payroll.batchDetailTitle, {
                        id: batchQuery.data.id,
                      })}
                    </SheetTitle>
                    <SheetDescription>
                      {t(translations.management.payroll.batchDetailDescription, {
                        cutoff: dateTimeFormatter.format(
                          new Date(batchQuery.data.cutoffAt),
                        ),
                      })}
                    </SheetDescription>
                  </div>
                  {mode === 'pending' &&
                  batchQuery.data.paidRecipientCount === 0 ? (
                    <Button
                      disabled={cancelBatchMutation.isPending}
                          onClick={() => setCancelBatch(batchQuery.data)}
                      size="sm"
                      variant="destructive"
                    >
                      {cancelBatchMutation.isPending ? (
                        <LoaderCircle aria-hidden="true" className="animate-spin" />
                      ) : (
                        <X aria-hidden="true" />
                      )}
                      {t(translations.management.payroll.cancelBatch)}
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                  <span>
                    {t(translations.management.payroll.taskCount)}: {batchQuery.data.taskCount}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {t(translations.management.payroll.grandTotal)}:{' '}
                    {formatTotals(batchQuery.data.grandTotals, i18n.language)}
                  </span>
                  <span className="text-muted-foreground">
                    {statusLabel(batchQuery.data.status)}
                  </span>
                </div>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="grid gap-6 lg:grid-cols-[minmax(17rem,0.78fr)_minmax(0,1.7fr)]">
                  <section className="space-y-2 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-16rem)] lg:self-start lg:overflow-y-auto">
                  <h3 className="text-sm font-semibold">
                    {t(translations.management.payroll.batchMembers)}
                  </h3>
                  <div className="divide-y rounded-xl border border-border/70">
                    <button
                      aria-pressed={selectedRecipientId === null}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm ${selectedRecipientId === null ? 'bg-muted/50 font-semibold' : 'hover:bg-muted/30'}`}
                      onClick={() => {
                        setSelectedRecipientId(null);
                        setDetailPage(0);
                      }}
                      type="button"
                    >
                      <span>{t(translations.management.payroll.batchAllMembers)}</span>
                      <span className="tabular-nums">{batchQuery.data.taskCount}</span>
                    </button>
                    {batchQuery.data.recipients.map((recipient) => (
                      <div
                        className={`flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 ${selectedRecipientId === recipient.discordUserId ? 'bg-muted/50' : ''}`}
                        key={recipient.discordUserId}
                      >
                        <button
                          aria-pressed={selectedRecipientId === recipient.discordUserId}
                          className="min-w-0 flex-1 text-left"
                          onClick={() => {
                            setSelectedRecipientId(recipient.discordUserId);
                            setDetailPage(0);
                          }}
                          type="button"
                        >
                          <span className="block truncate text-sm font-semibold">
                            {recipient.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {recipient.taskCount} · {statusLabel(recipient.status === 'PAID' ? 'PAID' : 'OPEN')}
                          </span>
                        </button>
                        <span className="text-right text-sm font-semibold tabular-nums">
                          {formatTotals(recipient.grandTotals, i18n.language)}
                        </span>
                        {mode === 'pending' && recipient.status === 'PENDING' ? (
                          <Button
                            disabled={payMutation.isPending}
                            onClick={() => setPayRecipient(recipient)}
                            size="sm"
                          >
                            {payMutation.isPending ? (
                              <LoaderCircle aria-hidden="true" className="animate-spin" />
                            ) : (
                              <Banknote aria-hidden="true" />
                            )}
                            {t(translations.management.payroll.batchPayMember)}
                          </Button>
                        ) : recipient.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            <Check aria-hidden="true" className="size-4" />
                            {t(translations.management.payroll.paidStatus)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>

                  <section className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {t(translations.management.payroll.taskDetails)}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedRecipient?.displayName ??
                          t(translations.management.payroll.batchAllMembers)}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t(translations.management.payroll.batchPageSummary, {
                        current: batchQuery.data.page + 1,
                        total: batchQuery.data.pageCount,
                        count: batchQuery.data.total,
                      })}
                    </span>
                  </div>
                  {batchQuery.data.tasks.length === 0 ? (
                    <p className="rounded-xl bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                      {t(translations.management.payroll.batchNoTasks)}
                    </p>
                  ) : (
                    <>
                      <div className="hidden overflow-x-auto rounded-xl border border-border/70 lg:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {!selectedRecipientId ? (
                                <TableHead>{t(translations.management.payroll.member)}</TableHead>
                              ) : null}
                              <TableHead>{t(translations.management.payroll.storyChapterStage)}</TableHead>
                              <TableHead>{t(translations.management.payroll.completedAt)}</TableHead>
                              <TableHead>{t(translations.management.payroll.baseSalary)}</TableHead>
                              <TableHead>{t(translations.management.payroll.reward)}</TableHead>
                              {mode === 'pending' ? <TableHead /> : null}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {batchQuery.data.tasks.map((task) => (
                              <TableRow key={task.id}>
                                {!selectedRecipientId ? (
                                  <TableCell className="whitespace-nowrap">
                                    {batchQuery.data.recipients.find(
                                      (recipient) => recipient.discordUserId === task.recipientDiscordUserId,
                                    )?.displayName ?? task.recipientDiscordUserId}
                                  </TableCell>
                                ) : null}
                                <TableCell className="min-w-56">
                                  <p className="font-medium">{task.storyTitle}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {task.chapterName} · {task.stageName}
                                  </p>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {task.completedAt
                                    ? dateTimeFormatter.format(new Date(task.completedAt))
                                    : '—'}
                                </TableCell>
                                <TableCell className="min-w-44">
                                  {mode === 'pending' && task.paymentStatus !== 'PAID' ? (
                                    <Input
                                      aria-label={t(translations.management.payroll.baseSalary)}
                                      className="h-8 w-36 text-right tabular-nums"
                                      min="0"
                                      onChange={(event) =>
                                        setDraftPrices((current) => ({
                                          ...current,
                                          [task.id]: event.target.value,
                                        }))
                                      }
                                      step="0.01"
                                      type="number"
                                      value={draftPrices[task.id] ?? task.agreedPrice}
                                    />
                                  ) : (
                                    `${formatNumber(task.agreedPrice, i18n.language)} ${task.currency}`
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap tabular-nums">
                                  {`${formatNumber(task.rewardAmount, i18n.language)} ${task.currency}`}
                                </TableCell>
                                {mode === 'pending' ? (
                                  <TableCell>
                                    {draftPrices[task.id] !== undefined ? (
                                      <Button
                                        aria-label={t(translations.management.payroll.batchSavePrice)}
                                        disabled={priceMutation.isPending}
                                        onClick={() => handleSavePrice(task)}
                                        size="icon"
                                        variant="outline"
                                      >
                                        {priceMutation.isPending ? (
                                          <LoaderCircle aria-hidden="true" className="animate-spin" />
                                        ) : (
                                          <Save aria-hidden="true" />
                                        )}
                                      </Button>
                                    ) : null}
                                  </TableCell>
                                ) : null}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <ul className="space-y-3 lg:hidden">
                        {batchQuery.data.tasks.map((task) => (
                          <li
                            className="rounded-xl border border-border/70 bg-card p-3"
                            key={task.id}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                              {!selectedRecipientId ? (
                                <span className="font-semibold text-foreground">
                                  {batchQuery.data.recipients.find(
                                    (recipient) => recipient.discordUserId === task.recipientDiscordUserId,
                                  )?.displayName ?? task.recipientDiscordUserId}
                                </span>
                              ) : null}
                              <span>
                                {task.completedAt
                                  ? dateTimeFormatter.format(new Date(task.completedAt))
                                  : '—'}
                              </span>
                            </div>
                            <p className="mt-2 font-semibold break-words">
                              {task.storyTitle}
                            </p>
                            <p className="text-xs break-words text-muted-foreground">
                              {task.chapterName} · {task.stageName}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                  {t(translations.management.payroll.baseSalary)}
                                </p>
                                {mode === 'pending' && task.paymentStatus !== 'PAID' ? (
                                  <Input
                                    aria-label={t(translations.management.payroll.baseSalary)}
                                    className="mt-1 h-9 text-right tabular-nums"
                                    min="0"
                                    onChange={(event) =>
                                      setDraftPrices((current) => ({
                                        ...current,
                                        [task.id]: event.target.value,
                                      }))
                                    }
                                    step="0.01"
                                    type="number"
                                    value={draftPrices[task.id] ?? task.agreedPrice}
                                  />
                                ) : (
                                  <p className="mt-1 font-semibold break-words tabular-nums">
                                    {`${formatNumber(task.agreedPrice, i18n.language)} ${task.currency}`}
                                  </p>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                  {t(translations.management.payroll.reward)}
                                </p>
                                <p className="mt-1 font-semibold break-words tabular-nums">
                                  {`${formatNumber(task.rewardAmount, i18n.language)} ${task.currency}`}
                                </p>
                              </div>
                            </div>
                            {mode === 'pending' && draftPrices[task.id] !== undefined ? (
                              <Button
                                className="mt-3 w-full"
                                disabled={priceMutation.isPending}
                                onClick={() => handleSavePrice(task)}
                                variant="outline"
                              >
                                {priceMutation.isPending ? (
                                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                                ) : (
                                  <Save aria-hidden="true" />
                                )}
                                {t(translations.management.payroll.batchSavePrice)}
                              </Button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {batchQuery.data.pageCount > 1 ? (
                    <div className="flex items-center justify-between gap-3">
                      <Button
                        disabled={batchQuery.isFetching || detailPage <= 0}
                        onClick={() => setDetailPage((page) => Math.max(0, page - 1))}
                        size="sm"
                        variant="outline"
                      >
                        <ChevronLeft aria-hidden="true" />
                        {t(translations.management.payroll.previousPage)}
                      </Button>
                      <Button
                        disabled={batchQuery.isFetching || detailPage + 1 >= batchQuery.data.pageCount}
                        onClick={() => setDetailPage((page) => page + 1)}
                        size="sm"
                      >
                        {t(translations.management.payroll.nextPage)}
                        <ChevronRight aria-hidden="true" />
                      </Button>
                    </div>
                  ) : null}
                  </section>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !payMutation.isPending) setPayRecipient(null);
        }}
        open={payRecipient !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(translations.management.payroll.batchPayConfirm)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {payRecipient
                ? t(translations.management.payroll.batchPayDescription, {
                    count: payRecipient.taskCount,
                    member: payRecipient.displayName,
                  })
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {payRecipient ? (
            <p className="rounded-lg bg-muted/40 p-3 text-sm font-semibold tabular-nums">
              {formatTotals(payRecipient.grandTotals, i18n.language)}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={payMutation.isPending}>
              {t(translations.management.payroll.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction disabled={payMutation.isPending} onClick={handlePayRecipient}>
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

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !cancelBatchMutation.isPending) setCancelBatch(null);
        }}
        open={cancelBatch !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(translations.management.payroll.batchCancelConfirm)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(translations.management.payroll.batchCancelDescription)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelBatchMutation.isPending}>
              {t(translations.management.payroll.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelBatchMutation.isPending}
              onClick={handleCancelBatch}
            >
              {cancelBatchMutation.isPending ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <X aria-hidden="true" />
              )}
              {t(translations.management.payroll.cancelBatch)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatTotals(
  totals: readonly { readonly currency: string; readonly total: number }[],
  language: string,
): string {
  if (totals.length === 0) return '0';
  return totals
    .map(
      ({ currency, total }) =>
        `${formatNumber(total, language)} ${currency}`,
    )
    .join(' · ');
}

function formatNumber(value: string | number, language: string): string {
  return new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(
    Number(value),
  );
}

function getWorkspaceDateTimeLocal(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function workspaceDateTimeToUtc(value: string, timezone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const desiredTime = Date.UTC(year, month - 1, day, hour, minute);
  let utcTime = desiredTime;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const represented = getWorkspaceDateTimeLocal(new Date(utcTime), timezone);
    const representedMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(
      represented,
    );
    if (!representedMatch) return null;
    const [, representedYear, representedMonth, representedDay, representedHour, representedMinute] = representedMatch;
    const representedTime = Date.UTC(
      Number(representedYear),
      Number(representedMonth) - 1,
      Number(representedDay),
      Number(representedHour),
      Number(representedMinute),
    );
    const difference = desiredTime - representedTime;
    if (difference === 0) break;
    utcTime += difference;
  }
  const result = new Date(utcTime);
  return getWorkspaceDateTimeLocal(result, timezone) === value ? result : null;
}
