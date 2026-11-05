import {
  Banknote,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  QrCode,
  Save,
  UserRound,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  usePayAllPayrollBatchRecipientsMutation,
  usePayPayrollBatchRecipientMutation,
  usePayrollBankQrQuery,
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
  const [isPayAllOpen, setIsPayAllOpen] = useState(false);
  const [qrRecipient, setQrRecipient] = useState<PayrollBatchRecipient | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
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
    { page: 0, pageSize: 1 },
    selectedBatchId !== null,
  );
  const taskQuery = usePayrollBatchQuery(
    workspaceId,
    selectedBatchId ?? '',
    {
      recipientDiscordUserId: selectedRecipientId ?? undefined,
      page: detailPage,
      pageSize: BATCH_PAGE_SIZE,
    },
    selectedBatchId !== null && selectedRecipientId !== null,
  );
  const qrQuery = usePayrollBankQrQuery(
    workspaceId,
    qrRecipient?.discordUserId ?? '',
    qrRecipient !== null,
  );
  const payMutation = usePayPayrollBatchRecipientMutation(
    workspaceId,
    selectedBatchId ?? '',
  );
  const payAllMutation = usePayAllPayrollBatchRecipientsMutation(
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
  const pendingRecipients = useMemo(
    () =>
      (batchQuery.data?.recipients ?? []).filter(
        (recipient) => recipient.status === 'PENDING',
      ),
    [batchQuery.data?.recipients],
  );
  const pendingTotals = useMemo(() => {
    const byCurrency = new Map<string, number>();
    for (const recipient of pendingRecipients)
      for (const { currency, total } of recipient.grandTotals)
        byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + total);
    return Array.from(byCurrency, ([currency, total]) => ({ currency, total }));
  }, [pendingRecipients]);

  useEffect(() => {
    if (!qrQuery.data) {
      setQrUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(qrQuery.data);
    setQrUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [qrQuery.data]);

  useEffect(() => {
    if (!cutoffTouched) setCutoffValue(getWorkspaceDateTimeLocal(new Date(), timezone));
  }, [cutoffTouched, timezone]);

  useEffect(() => {
    setSelectedBatchId(null);
    setSelectedRecipientId(null);
    setDetailPage(0);
    setDraftPrices({});
    setPayRecipient(null);
    setIsPayAllOpen(false);
    setQrRecipient(null);
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

  function handlePayAll(): void {
    if (pendingRecipients.length === 0) return;
    payAllMutation.mutate(
      pendingRecipients.map((recipient) => recipient.discordUserId),
      {
        onSuccess: ({ paidDiscordUserIds, failures }) => {
          setIsPayAllOpen(false);
          if (failures.length === 0) {
            toast.success(
              t(translations.management.payroll.batchPayAllSuccess, {
                count: paidDiscordUserIds.length,
              }),
            );
            return;
          }
          toast.error(
            t(translations.management.payroll.batchPayAllPartial, {
              paid: paidDiscordUserIds.length,
              failed: failures.length,
            }),
            { description: failures[0]?.message },
          );
        },
        onError: (error) => {
          toast.error(t(translations.management.payroll.paymentFailed), {
            description: formatError(error),
          });
        },
      },
    );
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
    return 'bg-primary/10 text-link';
  };

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm shadow-black/5">
        <CardHeader className="gap-4 border-b border-border/60 bg-card p-4 sm:p-5">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock aria-hidden="true" className="size-5 text-link" />
              {mode === 'pending'
                ? t(translations.management.payroll.batchesPendingTitle)
                : t(translations.management.payroll.batchesHistoryTitle)}
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              {mode === 'pending'
                ? t(translations.management.payroll.batchesPendingDescription)
                : t(translations.management.payroll.batchesHistoryDescription)}
            </CardDescription>
          </div>
          {mode === 'pending' ? (
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 sm:flex-row sm:items-end sm:p-4">
              <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-xs">
                <Label htmlFor="payroll-cutoff">
                  {t(translations.management.payroll.batchCutoff)}
                </Label>
                <Input
                  className="bg-background"
                  id="payroll-cutoff"
                  max={workspaceNowValue}
                  onChange={(event) => {
                    setCutoffValue(event.target.value);
                    setCutoffTouched(true);
                  }}
                  type="datetime-local"
                  value={effectiveCutoffValue}
                />
              </div>
              <Button
                className="w-full shrink-0 sm:w-auto"
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
              <p className="text-xs leading-5 text-muted-foreground sm:flex-1 sm:pb-2 sm:text-right">
                {t(translations.management.payroll.closePayrollHint)}
                <br />
                {t(translations.management.payroll.batchTimezone, { timezone })}
              </p>
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
            <ul className="divide-y divide-border/60">
              {visibleBatches.map((batch) => {
                const progress =
                  batch.recipientCount > 0
                    ? Math.round(
                        (batch.paidRecipientCount / batch.recipientCount) * 100,
                      )
                    : 0;
                return (
                  <li
                    className="flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-muted/20 sm:px-5 lg:flex-row lg:items-center"
                    key={batch.id}
                  >
                    <div className="min-w-0 lg:w-64">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {dateTimeFormatter.format(new Date(batch.cutoffAt))}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClassName(batch.status)}`}
                        >
                          {statusLabel(batch.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {batch.taskCount} task · {batch.recipientCount}{' '}
                        {t(translations.management.payroll.batchMembers).toLowerCase()}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>
                          {t(translations.management.payroll.batchPaidProgress, {
                            paid: batch.paidRecipientCount,
                            total: batch.recipientCount,
                          })}
                        </span>
                        <span className="tabular-nums">{progress}%</span>
                      </div>
                      <div
                        aria-hidden="true"
                        className="h-2 overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 lg:w-auto lg:justify-end">
                      <p className="text-base font-bold break-words tabular-nums">
                        {formatTotals(batch.grandTotals, i18n.language)}
                      </p>
                      <Button
                        onClick={() => {
                          setSelectedBatchId(String(batch.id));
                          setSelectedRecipientId(null);
                          setDetailPage(0);
                        }}
                        size="sm"
                        variant={mode === 'pending' ? 'default' : 'outline'}
                      >
                        <Eye aria-hidden="true" />
                        {t(translations.management.payroll.viewDetails)}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
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
              <SheetHeader className="shrink-0 space-y-4 border-b border-border/60 p-0 pb-4 sm:pb-5">
                <div className="flex min-w-0 flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <SheetTitle className="text-lg sm:text-xl">
                        {t(translations.management.payroll.batchDetailTitle, {
                          id: batchQuery.data.id,
                        })}
                      </SheetTitle>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName(batchQuery.data.status)}`}
                      >
                        {statusLabel(batchQuery.data.status)}
                      </span>
                    </div>
                    <SheetDescription>
                      {t(translations.management.payroll.batchDetailDescription, {
                        cutoff: dateTimeFormatter.format(
                          new Date(batchQuery.data.cutoffAt),
                        ),
                      })}
                    </SheetDescription>
                  </div>
                  {mode === 'pending' ? (
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      {batchQuery.data.paidRecipientCount === 0 ? (
                        <Button
                          disabled={
                            cancelBatchMutation.isPending ||
                            payAllMutation.isPending
                          }
                          onClick={() => setCancelBatch(batchQuery.data)}
                          size="sm"
                          variant="outline"
                        >
                          {cancelBatchMutation.isPending ? (
                            <LoaderCircle aria-hidden="true" className="animate-spin" />
                          ) : (
                            <X aria-hidden="true" />
                          )}
                          {t(translations.management.payroll.cancelBatch)}
                        </Button>
                      ) : null}
                      {pendingRecipients.length > 0 ? (
                        <Button
                          disabled={payAllMutation.isPending || payMutation.isPending}
                          onClick={() => setIsPayAllOpen(true)}
                        >
                          {payAllMutation.isPending ? (
                            <LoaderCircle aria-hidden="true" className="animate-spin" />
                          ) : (
                            <CheckCheck aria-hidden="true" />
                          )}
                          {t(translations.management.payroll.batchPayAll, {
                            count: pendingRecipients.length,
                          })}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="min-w-0 rounded-xl bg-muted/40 p-3">
                    <dt className="text-xs text-muted-foreground">
                      {t(translations.management.payroll.taskCount)}
                    </dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums">
                      {batchQuery.data.taskCount}
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-xl bg-muted/40 p-3">
                    <dt className="text-xs text-muted-foreground">
                      {t(translations.management.payroll.batchMembers)}
                    </dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums">
                      {t(translations.management.payroll.batchPaidProgress, {
                        paid: batchQuery.data.paidRecipientCount,
                        total: batchQuery.data.recipientCount,
                      })}
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-xl bg-muted/40 p-3">
                    <dt className="text-xs text-muted-foreground">
                      {t(translations.management.payroll.grandTotal)}
                    </dt>
                    <dd className="mt-1 text-lg font-bold break-words tabular-nums">
                      {formatTotals(batchQuery.data.grandTotals, i18n.language)}
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-xl bg-primary/10 p-3">
                    <dt className="text-xs text-muted-foreground">
                      {t(translations.management.payroll.batchRemaining)}
                    </dt>
                    <dd className="mt-1 text-lg font-bold break-words tabular-nums">
                      {formatTotals(pendingTotals, i18n.language)}
                    </dd>
                  </div>
                </dl>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto pt-4">
                <h3 className="mb-3 text-sm font-semibold">
                  {t(translations.management.payroll.batchMembers)}
                </h3>
                <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
                  {batchQuery.data.recipients.map((recipient) => (
                    <li
                      className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center"
                      key={recipient.discordUserId}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {recipient.avatarUrl ? (
                          <img
                            alt=""
                            className="size-10 shrink-0 rounded-xl object-cover"
                            src={recipient.avatarUrl}
                          />
                        ) : (
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-link">
                            <UserRound aria-hidden="true" className="size-5" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {recipient.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {recipient.taskCount} task
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <p className="font-bold break-words tabular-nums sm:w-40 sm:text-right">
                          {formatTotals(recipient.grandTotals, i18n.language)}
                        </p>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${recipient.status === 'PAID' ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-link'}`}
                        >
                          {recipient.status === 'PAID' ? (
                            <Check aria-hidden="true" className="size-3.5" />
                          ) : null}
                          {recipient.status === 'PAID'
                            ? t(translations.management.payroll.paidStatus)
                            : t(translations.management.payroll.pendingStatus)}
                        </span>
                      </div>
                      <div className="flex gap-2 sm:justify-end">
                        <Button
                          className="flex-1 sm:flex-none"
                          onClick={() => {
                            setSelectedRecipientId(recipient.discordUserId);
                            setDetailPage(0);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Eye aria-hidden="true" />
                          {t(translations.management.payroll.viewDetails)}
                        </Button>
                        {mode === 'pending' && recipient.status === 'PENDING' ? (
                          <Button
                            className="flex-1 sm:flex-none"
                            onClick={() => setQrRecipient(recipient)}
                            size="sm"
                            variant="outline"
                          >
                            <QrCode aria-hidden="true" />
                            {t(translations.management.payroll.batchShowQr)}
                          </Button>
                        ) : null}
                        {mode === 'pending' && recipient.status === 'PENDING' ? (
                          <Button
                            className="flex-1 sm:flex-none"
                            disabled={payMutation.isPending || payAllMutation.isPending}
                            onClick={() => setPayRecipient(recipient)}
                            size="sm"
                          >
                            <Banknote aria-hidden="true" />
                            {t(translations.management.payroll.batchPayMember)}
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRecipientId(null);
            setDetailPage(0);
            setDraftPrices({});
          }
        }}
        open={selectedRecipientId !== null}
      >
        <DialogContent className="flex max-h-[90dvh] flex-col gap-4 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRecipient?.displayName ??
                t(translations.management.payroll.taskDetails)}
            </DialogTitle>
            <DialogDescription>
              {taskQuery.data
                ? t(translations.management.payroll.batchPageSummary, {
                    current: taskQuery.data.page + 1,
                    total: taskQuery.data.pageCount,
                    count: taskQuery.data.total,
                  })
                : t(translations.management.payroll.taskDetails)}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {taskQuery.isError ? (
              <p className="text-sm text-destructive">
                {formatError(taskQuery.error)}
              </p>
            ) : !taskQuery.data ? (
              <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                {t(translations.management.payroll.loading)}
              </div>
            ) : (
              <>
                    {taskQuery.data.tasks.length === 0 ? (
                      <p className="rounded-xl bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                        {t(translations.management.payroll.batchNoTasks)}
                      </p>
                    ) : (
                      <>
                      <div className="hidden min-w-0 overflow-x-auto rounded-xl border border-border/70 lg:block">
                        <Table className="min-w-[46rem]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t(translations.management.payroll.storyChapterStage)}</TableHead>
                              <TableHead className="whitespace-nowrap">
                                {t(translations.management.payroll.completedAt)}
                              </TableHead>
                              <TableHead className="text-right whitespace-nowrap">
                                {t(translations.management.payroll.baseSalary)}
                              </TableHead>
                              <TableHead className="text-right whitespace-nowrap">
                                {t(translations.management.payroll.reward)}
                              </TableHead>
                              {mode === 'pending' ? <TableHead /> : null}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {taskQuery.data.tasks.map((task) => (
                              <TableRow key={task.id}>
                                <TableCell className="min-w-56">
                                  <p className="font-medium break-words">{task.storyTitle}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {task.chapterName} · {task.stageName}
                                  </p>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                  {task.completedAt
                                    ? dateTimeFormatter.format(new Date(task.completedAt))
                                    : '—'}
                                </TableCell>
                                <TableCell className="min-w-44 text-right">
                                  {mode === 'pending' && task.paymentStatus !== 'PAID' ? (
                                    <PriceInput
                                      aria-label={t(translations.management.payroll.baseSalary)}
                                      className="h-8 w-36 text-right tabular-nums"
                                      language={i18n.language}
                                      onChange={(value) =>
                                        setDraftPrices((current) => ({ ...current, [task.id]: value }))
                                      }
                                      value={draftPrices[task.id] ?? task.agreedPrice}
                                    />
                                  ) : (
                                    `${formatNumber(task.agreedPrice, i18n.language)} ${task.currency}`
                                  )}
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap tabular-nums">
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
                        {taskQuery.data.tasks.map((task) => (
                          <li
                            className="rounded-xl border border-border/70 bg-card p-3"
                            key={task.id}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2 text-xs text-muted-foreground">
                              <span className="text-right break-words">
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
                                  <PriceInput
                                    aria-label={t(translations.management.payroll.baseSalary)}
                                    className="mt-1 h-9 text-right tabular-nums"
                                    language={i18n.language}
                                    onChange={(value) =>
                                      setDraftPrices((current) => ({ ...current, [task.id]: value }))
                                    }
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
                    {taskQuery.data.pageCount > 1 ? (
                      <div className="flex items-center justify-between gap-3">
                      <Button
                        disabled={taskQuery.isFetching || detailPage <= 0}
                        onClick={() => setDetailPage((page) => Math.max(0, page - 1))}
                        size="sm"
                        variant="outline"
                      >
                        <ChevronLeft aria-hidden="true" />
                        {t(translations.management.payroll.previousPage)}
                      </Button>
                      <Button
                        disabled={taskQuery.isFetching || detailPage + 1 >= taskQuery.data.pageCount}
                        onClick={() => setDetailPage((page) => page + 1)}
                        size="sm"
                      >
                        {t(translations.management.payroll.nextPage)}
                        <ChevronRight aria-hidden="true" />
                      </Button>
                      </div>
                    ) : null}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog
        onOpenChange={(open) => {
          if (!open) setQrRecipient(null);
        }}
        open={qrRecipient !== null}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t(translations.management.payroll.batchQrTitle)}
            </DialogTitle>
            <DialogDescription>{qrRecipient?.displayName}</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              {t(translations.management.payroll.batchQrAmount)}
            </p>
            <p className="mt-1 text-xl font-extrabold tabular-nums">
              {qrRecipient
                ? formatTotals(qrRecipient.grandTotals, i18n.language)
                : null}
            </p>
          </div>
          {qrQuery.isLoading ? (
            <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle aria-hidden="true" className="animate-spin" />
              {t(translations.management.payroll.bankQrLoading)}
            </div>
          ) : qrQuery.isError ? (
            <p className="rounded-xl bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
              {t(translations.management.payroll.bankQrMissing)}
            </p>
          ) : qrUrl ? (
            <div className="flex justify-center rounded-xl border border-border/70 bg-white p-3">
              <img
                alt={t(translations.management.payroll.bankQr)}
                className="max-h-72 w-auto object-contain"
                src={qrUrl}
              />
            </div>
          ) : null}
          {mode === 'pending' && qrRecipient ? (
            <Button
              onClick={() => {
                setPayRecipient(qrRecipient);
                setQrRecipient(null);
              }}
            >
              <Banknote aria-hidden="true" />
              {t(translations.management.payroll.batchPayMember)}
            </Button>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !payAllMutation.isPending) setIsPayAllOpen(false);
        }}
        open={isPayAllOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(translations.management.payroll.batchPayAllConfirm)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(translations.management.payroll.batchPayAllDescription, {
                count: pendingRecipients.length,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">
              {t(translations.management.payroll.batchPayAllTotal)}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              {formatTotals(pendingTotals, i18n.language)}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={payAllMutation.isPending}>
              {t(translations.management.payroll.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={payAllMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                handlePayAll();
              }}
            >
              {payAllMutation.isPending ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <CheckCheck aria-hidden="true" />
              )}
              {payAllMutation.isPending
                ? t(translations.management.payroll.batchPayAllProcessing)
                : t(translations.management.payroll.confirmAction)}
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

interface PriceInputProps {
  readonly 'aria-label': string;
  readonly className?: string;
  readonly language: string;
  readonly onChange: (value: string) => void;
  readonly value: string;
}

function PriceInput({ language, onChange, value, ...props }: PriceInputProps) {
  const digits = value.split('.')[0] ?? '';
  const displayValue = digits
    ? new Intl.NumberFormat(language).format(Number(digits))
    : '';

  return (
    <Input
      {...props}
      inputMode="numeric"
      onChange={(event) =>
        onChange(event.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''))
      }
      type="text"
      value={displayValue}
    />
  );
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
