import {
  Check,
  CircleAlert,
  Edit3,
  Layers3,
  MoreHorizontal,
  Plus,
  Power,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
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
  useCreateStageMutation,
  useStagesQuery,
  useUpdateStageMutation,
  useUpdateStageStatusMutation,
} from '@/features/stages/hooks';
import type {
  Stage,
  StageFormValues,
  StagePayload,
} from '@/features/stages/types';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

const PAGE_SIZE = 25;

const EMPTY_FORM: StageFormValues = {
  name: '',
  description: '',
  defaultPrice: '0',
  durationHours: '24',
  displayOrder: '0',
};

function isForbiddenError(error: unknown): boolean {
  const message = formatError(error).toLocaleLowerCase();
  return (
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('quyền')
  );
}

function formatStagePrice(
  value: string,
  currency: string,
  locale: string,
): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency}`;
  try {
    return new Intl.NumberFormat(locale, {
      currency,
      maximumFractionDigits: 2,
      style: 'currency',
    }).format(amount);
  } catch {
    return `${value} ${currency}`;
  }
}

function StageStatus({
  active,
  t,
}: {
  readonly active: boolean;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
    >
      {active ? <Check aria-hidden="true" className="size-3.5" /> : null}
      {active ? t(translations.stages.active) : t(translations.stages.inactive)}
    </span>
  );
}

function StageForm({
  editingStage,
  isPending,
  onCancel,
  onSubmit,
  t,
}: {
  readonly editingStage: Stage | null;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (payload: StagePayload) => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const [values, setValues] = useState<StageFormValues>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setValues(
      editingStage
        ? {
            name: editingStage.name,
            description: editingStage.description ?? '',
            defaultPrice: editingStage.defaultPrice,
            durationHours: String(editingStage.defaultDurationHours),
            displayOrder: String(editingStage.displayOrder),
          }
        : EMPTY_FORM,
    );
    setValidationError(null);
  }, [editingStage]);

  function setValue<Key extends keyof StageFormValues>(
    key: Key,
    value: StageFormValues[Key],
  ): void {
    setValues((current) => ({ ...current, [key]: value }));
    setValidationError(null);
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const name = values.name.trim();
    const defaultPrice = values.defaultPrice.trim();
    const durationHours = Number(values.durationHours);
    const displayOrder = Number(values.displayOrder);
    if (!name || !defaultPrice) {
      setValidationError(t(translations.stages.invalidRequired));
      return;
    }
    if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(defaultPrice)) {
      setValidationError(t(translations.stages.invalidPrice));
      return;
    }
    if (!Number.isInteger(durationHours) || durationHours < 1) {
      setValidationError(t(translations.stages.invalidWholeNumber));
      return;
    }
    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setValidationError(t(translations.stages.invalidWholeNumber));
      return;
    }
    onSubmit({
      defaultPrice,
      description: values.description.trim() || undefined,
      displayOrder,
      durationHours,
      name,
    });
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      {editingStage ? (
        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t(translations.stages.code)}
          </p>
          <p className="mt-1 font-mono text-sm font-semibold">
            {editingStage.code}
          </p>
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="stage-name">{t(translations.stages.name)}</Label>
        <Input
          id="stage-name"
          maxLength={100}
          onChange={(event) => setValue('name', event.target.value)}
          value={values.name}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="stage-description">
          {t(translations.stages.descriptionField)}
        </Label>
        <Textarea
          id="stage-description"
          onChange={(event) => setValue('description', event.target.value)}
          rows={3}
          value={values.description}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="stage-duration">
            {t(translations.stages.durationHours)}
          </Label>
          <Input
            id="stage-duration"
            min={1}
            onChange={(event) => setValue('durationHours', event.target.value)}
            type="number"
            value={values.durationHours}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="stage-price">
            {t(translations.stages.defaultPrice)}
          </Label>
          <Input
            id="stage-price"
            inputMode="decimal"
            onChange={(event) => setValue('defaultPrice', event.target.value)}
            placeholder={t(translations.stages.defaultPriceHint)}
            value={values.defaultPrice}
          />
        </div>
      </div>
      <div className="grid gap-2 sm:max-w-[calc(50%-0.5rem)]">
        <Label htmlFor="stage-order">
          {t(translations.stages.displayOrder)}
        </Label>
        <Input
          id="stage-order"
          min={0}
          onChange={(event) => setValue('displayOrder', event.target.value)}
          type="number"
          value={values.displayOrder}
        />
      </div>
      {validationError ? (
        <p className="text-sm text-destructive" role="alert">
          {validationError}
        </p>
      ) : null}
      <DialogFooter>
        <Button onClick={onCancel} type="button" variant="outline">
          {t(translations.stages.cancel)}
        </Button>
        <Button disabled={isPending} type="submit">
          {t(translations.stages.save)}
        </Button>
      </DialogFooter>
    </form>
  );
}

function StageRow({
  locale,
  onDeactivate,
  onEdit,
  onToggle,
  stage,
  t,
}: {
  readonly locale: string;
  readonly onDeactivate: (stage: Stage) => void;
  readonly onEdit: (stage: Stage) => void;
  readonly onToggle: (stage: Stage) => void;
  readonly stage: Stage;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <TableRow>
      <TableCell className="w-20 font-mono text-xs text-muted-foreground">
        {stage.displayOrder}
      </TableCell>
      <TableCell>
        <div className="min-w-36">
          <p className="font-semibold">{stage.name}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {stage.code}
          </p>
        </div>
      </TableCell>
      <TableCell className="max-w-64 text-muted-foreground">
        <p className="line-clamp-2">
          {stage.description || t(translations.stages.notSet)}
        </p>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {stage.defaultDurationHours} {t(translations.stages.hoursShort)}
      </TableCell>
      <TableCell className="font-medium whitespace-nowrap">
        {formatStagePrice(stage.defaultPrice, stage.currency, locale)} ·{' '}
        {stage.currency}
      </TableCell>
      <TableCell>
        <StageStatus active={stage.isActive} t={t} />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            aria-label={`${t(translations.stages.edit)}: ${stage.name}`}
            onClick={() => onEdit(stage)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Edit3 aria-hidden="true" />
          </Button>
          <Button
            aria-label={`${stage.isActive ? t(translations.stages.deactivate) : t(translations.stages.activate)}: ${stage.name}`}
            onClick={() =>
              stage.isActive ? onDeactivate(stage) : onToggle(stage)
            }
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Power aria-hidden="true" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function StageCard({
  locale,
  onDeactivate,
  onEdit,
  onToggle,
  stage,
  t,
}: Parameters<typeof StageRow>[0]) {
  return (
    <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-mono text-xs font-semibold text-primary">
            {stage.displayOrder}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{stage.name}</h3>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {stage.code}
            </p>
          </div>
        </div>
        <StageStatus active={stage.isActive} t={t} />
      </div>
      <p className="mt-4 min-h-10 text-sm leading-5 text-muted-foreground">
        {stage.description || t(translations.stages.notSet)}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/30 p-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">
            {t(translations.stages.durationHours)}
          </p>
          <p className="mt-1 font-semibold">
            {stage.defaultDurationHours} {t(translations.stages.hoursShort)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {t(translations.stages.defaultPrice)}
          </p>
          <p className="mt-1 font-semibold">
            {formatStagePrice(stage.defaultPrice, stage.currency, locale)} ·{' '}
            {stage.currency}
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-1 border-t border-border/60 pt-3">
        <Button
          onClick={() => onEdit(stage)}
          size="sm"
          type="button"
          variant="outline"
        >
          <Edit3 aria-hidden="true" />
          {t(translations.stages.edit)}
        </Button>
        <Button
          onClick={() =>
            stage.isActive ? onDeactivate(stage) : onToggle(stage)
          }
          size="sm"
          type="button"
          variant="ghost"
        >
          <Power aria-hidden="true" />
          {stage.isActive
            ? t(translations.stages.deactivate)
            : t(translations.stages.activate)}
        </Button>
      </div>
    </article>
  );
}

function StageListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton className="h-20 rounded-2xl" key={index} />
      ))}
    </div>
  );
}

export default function StagesPage() {
  const { i18n, t } = useTranslation();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const [page, setPage] = useState(0);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [stageToDeactivate, setStageToDeactivate] = useState<Stage | null>(
    null,
  );
  const stagesQuery = useStagesQuery(workspaceId, page, PAGE_SIZE);
  const createMutation = useCreateStageMutation(workspaceId);
  const updateMutation = useUpdateStageMutation(workspaceId);
  const statusMutation = useUpdateStageStatusMutation(workspaceId);
  const isFormPending = createMutation.isPending || updateMutation.isPending;
  const stagePage = stagesQuery.data;
  const pageCount = stagePage?.pageCount ?? 1;
  const locale = i18n.language;

  const pageSummary = useMemo(
    () =>
      t(translations.stages.pageSummary, {
        count: stagePage?.items.length ?? 0,
        current: (stagePage?.page ?? page) + 1,
        total: pageCount,
      }),
    [page, pageCount, stagePage?.items.length, stagePage?.page, t],
  );

  function openCreate(): void {
    setEditingStage(null);
    setDialogMode('create');
  }

  function openEdit(stage: Stage): void {
    setEditingStage(stage);
    setDialogMode('edit');
  }

  function closeForm(): void {
    if (!isFormPending) setDialogMode(null);
  }

  function saveStage(payload: StagePayload): void {
    if (editingStage) {
      updateMutation.mutate(
        { payload, stageId: editingStage.id },
        {
          onSuccess: () => {
            setDialogMode(null);
            toast.success(t(translations.stages.updateSuccess));
          },
          onError: (error) => toast.error(formatError(error)),
        },
      );
      return;
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        setDialogMode(null);
        setPage(0);
        toast.success(t(translations.stages.createSuccess));
      },
      onError: (error) => toast.error(formatError(error)),
    });
  }

  function toggleStage(stage: Stage, isActive: boolean): void {
    statusMutation.mutate(
      { isActive, stageId: stage.id },
      {
        onSuccess: () => {
          setStageToDeactivate(null);
          toast.success(t(translations.stages.statusSuccess));
        },
        onError: (error) => toast.error(formatError(error)),
      },
    );
  }

  if (!workspaceId) {
    return (
      <Empty className="min-h-80 border bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Layers3 />
          </EmptyMedia>
          <EmptyTitle>{t(translations.stages.noWorkspace)}</EmptyTitle>
          <EmptyDescription>
            {t(translations.stages.noWorkspaceDescription)}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (stagesQuery.isPending) return <StageListSkeleton />;

  if (stagesQuery.isError) {
    const forbidden = isForbiddenError(stagesQuery.error);
    return (
      <Empty className="min-h-80 border border-destructive/20 bg-destructive/5">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleAlert />
          </EmptyMedia>
          <EmptyTitle>
            {forbidden
              ? t(translations.stages.forbidden)
              : t(translations.stages.error)}
          </EmptyTitle>
          <EmptyDescription>
            {forbidden
              ? t(translations.stages.workflowPreserved)
              : formatError(stagesQuery.error)}
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => void stagesQuery.refetch()} variant="outline">
          {t(translations.stages.retry)}
        </Button>
      </Empty>
    );
  }

  const items = stagePage?.items ?? [];
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t(translations.stages.title)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t(translations.stages.description)}
          </p>
          <p className="mt-3 text-sm font-semibold text-primary">
            {t(translations.stages.totalSummary, {
              active: stagePage?.activeTotal ?? 0,
              total: stagePage?.total ?? 0,
            })}
          </p>
        </div>
        <Button className="shadow-[var(--control-shadow)]" onClick={openCreate}>
          <Plus aria-hidden="true" />
          {t(translations.stages.add)}
        </Button>
      </div>

      <Card className="border-border/70 shadow-[var(--soft-shadow)]">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60 bg-muted/20">
          <div>
            <CardTitle className="text-base">
              {t(translations.stages.title)}
            </CardTitle>
            <CardDescription className="mt-1">{pageSummary}</CardDescription>
          </div>
          <MoreHorizontal
            aria-hidden="true"
            className="size-5 text-muted-foreground"
          />
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <Empty className="min-h-72 border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Layers3 />
                </EmptyMedia>
                <EmptyTitle>{t(translations.stages.empty)}</EmptyTitle>
                <EmptyDescription>
                  {t(translations.stages.emptyDescription)}
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" />
                {t(translations.stages.add)}
              </Button>
            </Empty>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t(translations.stages.displayOrder)}
                      </TableHead>
                      <TableHead>{t(translations.stages.name)}</TableHead>
                      <TableHead>
                        {t(translations.stages.descriptionField)}
                      </TableHead>
                      <TableHead>
                        {t(translations.stages.durationHours)}
                      </TableHead>
                      <TableHead>
                        {t(translations.stages.defaultPrice)}
                      </TableHead>
                      <TableHead>{t(translations.stages.status)}</TableHead>
                      <TableHead className="text-right">
                        {t(translations.stages.actions)}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((stage) => (
                      <StageRow
                        key={stage.id}
                        locale={locale}
                        onDeactivate={setStageToDeactivate}
                        onEdit={openEdit}
                        onToggle={(item) => toggleStage(item, true)}
                        stage={stage}
                        t={t}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3 p-4 md:hidden">
                {items.map((stage) => (
                  <StageCard
                    key={stage.id}
                    locale={locale}
                    onDeactivate={setStageToDeactivate}
                    onEdit={openEdit}
                    onToggle={(item) => toggleStage(item, true)}
                    stage={stage}
                    t={t}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
        {items.length > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3 sm:px-6">
            <Button
              disabled={
                (stagePage?.page ?? page) === 0 || stagesQuery.isFetching
              }
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              size="sm"
              variant="outline"
            >
              {t(translations.stages.previousPage)}
            </Button>
            <span className="text-xs text-muted-foreground">{pageSummary}</span>
            <Button
              disabled={
                (stagePage?.page ?? page) >= pageCount - 1 ||
                stagesQuery.isFetching
              }
              onClick={() =>
                setPage((current) => Math.min(pageCount - 1, current + 1))
              }
              size="sm"
              variant="outline"
            >
              {t(translations.stages.nextPage)}
            </Button>
          </div>
        ) : null}
      </Card>

      <Dialog
        onOpenChange={(open) => !open && closeForm()}
        open={dialogMode !== null}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'edit'
                ? t(translations.stages.edit)
                : t(translations.stages.add)}
            </DialogTitle>
            <DialogDescription>
              {t(translations.stages.description)}
            </DialogDescription>
          </DialogHeader>
          <StageForm
            editingStage={editingStage}
            isPending={isFormPending}
            onCancel={closeForm}
            onSubmit={saveStage}
            t={t}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !statusMutation.isPending) setStageToDeactivate(null);
        }}
        open={stageToDeactivate !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(translations.stages.confirmDeactivate)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(translations.stages.confirmDeactivateDescription)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusMutation.isPending}>
              {t(translations.stages.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={statusMutation.isPending}
              onClick={() => {
                if (stageToDeactivate) toggleStage(stageToDeactivate, false);
              }}
              variant="destructive"
            >
              {t(translations.stages.deactivate)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
