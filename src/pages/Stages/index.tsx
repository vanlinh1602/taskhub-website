import { CircleAlert, Layers3, Plus, Search } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAllStagesQuery,
  useCreateStageMutation,
  useReorderStagesMutation,
  useUpdateStageMutation,
  useUpdateStageStatusMutation,
} from '@/features/stages/hooks';
import type { Stage, StagePayload } from '@/features/stages/types';
import { getNextDisplayOrder, moveStage } from '@/features/stages/utils/order';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { useMediaQuery } from '@/hooks/use-media-query';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

import StageForm from './StageForm';
import StageRow from './StageRow';

const SIDE_PANEL_QUERY = '(min-width: 1280px)';
const STATUS_FILTERS = ['ALL', 'ACTIVE', 'INACTIVE'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function isForbiddenError(error: unknown): boolean {
  const message = formatError(error).toLocaleLowerCase();
  return (
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('quyền')
  );
}

function matchesFilter(
  stage: Stage,
  filter: StatusFilter,
  search: string,
): boolean {
  if (filter === 'ACTIVE' && !stage.isActive) return false;
  if (filter === 'INACTIVE' && stage.isActive) return false;
  return (
    !search ||
    stage.name.toLocaleLowerCase().includes(search) ||
    stage.code.toLocaleLowerCase().includes(search)
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
  const hasSidePanel = useMediaQuery(SIDE_PANEL_QUERY);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isFormDirty = useRef(false);
  const stagesQuery = useAllStagesQuery(workspaceId);
  const createMutation = useCreateStageMutation(workspaceId);
  const updateMutation = useUpdateStageMutation(workspaceId);
  const statusMutation = useUpdateStageStatusMutation(workspaceId);
  const reorderMutation = useReorderStagesMutation(workspaceId);
  const isFormPending = createMutation.isPending || updateMutation.isPending;

  const stages = useMemo(() => stagesQuery.data ?? [], [stagesQuery.data]);
  const normalizedSearch = searchText.trim().toLocaleLowerCase();
  const visibleStages = useMemo(
    () =>
      stages.filter((stage) => matchesFilter(stage, filter, normalizedSearch)),
    [filter, normalizedSearch, stages],
  );
  const selectedStage =
    stages.find((stage) => stage.id === selectedStageId) ?? null;
  const isReorderable = filter === 'ALL' && !normalizedSearch;
  const activeTotal = stages.filter((stage) => stage.isActive).length;
  const isFormVisible = isCreating || selectedStage !== null;
  const formTitle = isCreating
    ? t(translations.stages.add)
    : t(translations.stages.edit);

  const trackFormDirty = useCallback((isDirty: boolean): void => {
    isFormDirty.current = isDirty;
  }, []);

  function canLeaveForm(): boolean {
    return (
      !isFormDirty.current || window.confirm(t(translations.stages.unsaved))
    );
  }

  function openCreate(): void {
    if (!canLeaveForm()) return;
    setIsCreating(true);
    setSelectedStageId(null);
    setIsSheetOpen(true);
  }

  function selectStage(stage: Stage): void {
    if (stage.id !== selectedStageId && !canLeaveForm()) return;
    setIsCreating(false);
    setSelectedStageId(stage.id);
    setIsSheetOpen(true);
  }

  function cancelForm(): void {
    isFormDirty.current = false;
    if (isCreating) setIsCreating(false);
    if (!hasSidePanel) setIsSheetOpen(false);
  }

  function clearFilters(): void {
    setSearchText('');
    setFilter('ALL');
  }

  function saveStage(values: Omit<StagePayload, 'displayOrder'>): void {
    if (selectedStage && !isCreating) {
      updateMutation.mutate(
        {
          payload: { ...values, displayOrder: selectedStage.displayOrder },
          stageId: selectedStage.id,
        },
        {
          onSuccess: () => {
            if (!hasSidePanel) setIsSheetOpen(false);
            toast.success(t(translations.stages.updateSuccess));
          },
          onError: (error) => toast.error(formatError(error)),
        },
      );
      return;
    }
    createMutation.mutate(
      { ...values, displayOrder: getNextDisplayOrder(stages) },
      {
        onSuccess: (stage) => {
          isFormDirty.current = false;
          setIsCreating(false);
          setSelectedStageId(stage.id);
          if (!hasSidePanel) setIsSheetOpen(false);
          toast.success(t(translations.stages.createSuccess));
        },
        onError: (error) => toast.error(formatError(error)),
      },
    );
  }

  function changeStatus(stage: Stage, isActive: boolean): void {
    statusMutation.mutate(
      { isActive, stageId: stage.id },
      {
        onSuccess: () => {
          toast.success(
            t(
              isActive
                ? translations.stages.activatedToast
                : translations.stages.deactivatedToast,
              { name: stage.name },
            ),
            {
              action: {
                label: t(translations.stages.undo),
                onClick: () => changeStatus(stage, !isActive),
              },
            },
          );
        },
        onError: (error) => toast.error(formatError(error)),
      },
    );
  }

  function reorderStage(stage: Stage, offset: number): void {
    reorderMutation.mutate(moveStage(stages, stage.id, offset), {
      onError: (error) => toast.error(formatError(error)),
    });
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

  const form = (
    <StageForm
      isPending={isFormPending}
      key={isCreating ? 'new' : selectedStage?.id}
      language={i18n.language}
      onCancel={cancelForm}
      onDirtyChange={trackFormDirty}
      onSubmit={saveStage}
      stage={isCreating ? null : selectedStage}
    />
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t(translations.stages.title)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t(translations.stages.description)}
          </p>
        </div>
        <Button className="shadow-[var(--control-shadow)]" onClick={openCreate}>
          <Plus aria-hidden="true" />
          {t(translations.stages.add)}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-sm">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label={t(translations.stages.search)}
            className="pl-9"
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={t(translations.stages.search)}
            type="search"
            value={searchText}
          />
        </div>
        <div
          aria-label={t(translations.stages.status)}
          className="flex gap-0.5 rounded-xl bg-secondary p-1"
          role="group"
        >
          {STATUS_FILTERS.map((value) => (
            <Button
              aria-pressed={filter === value}
              className={
                filter === value
                  ? 'bg-card font-bold shadow-sm hover:bg-card'
                  : 'text-muted-foreground'
              }
              key={value}
              onClick={() => setFilter(value)}
              size="sm"
              type="button"
              variant="ghost"
            >
              {value === 'ALL'
                ? t(translations.stages.all)
                : value === 'ACTIVE'
                  ? t(translations.stages.active)
                  : t(translations.stages.inactive)}
            </Button>
          ))}
        </div>
        <p
          aria-live="polite"
          className="text-sm font-semibold text-muted-foreground sm:ml-auto"
        >
          {t(translations.stages.totalSummary, {
            active: activeTotal,
            total: stages.length,
          })}
        </p>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--soft-shadow)]">
          {stages.length === 0 ? (
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
          ) : visibleStages.length === 0 ? (
            <Empty className="min-h-72 border-0">
              <EmptyHeader>
                <EmptyTitle>{t(translations.stages.noResults)}</EmptyTitle>
                <EmptyDescription>
                  {t(translations.stages.noResultsDescription)}
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={clearFilters} variant="outline">
                {t(translations.stages.clearFilters)}
              </Button>
            </Empty>
          ) : (
            <ol aria-label={t(translations.stages.title)}>
              {visibleStages.map((stage) => {
                const position = stages.indexOf(stage);
                return (
                  <StageRow
                    canMoveDown={
                      position < stages.length - 1 && !reorderMutation.isPending
                    }
                    canMoveUp={position > 0 && !reorderMutation.isPending}
                    isReorderable={isReorderable}
                    isSelected={!isCreating && stage.id === selectedStageId}
                    isStatusPending={statusMutation.isPending}
                    key={stage.id}
                    onMove={reorderStage}
                    onSelect={selectStage}
                    onToggle={(item) => changeStatus(item, !item.isActive)}
                    position={position + 1}
                    stage={stage}
                  />
                );
              })}
            </ol>
          )}
        </div>

        {hasSidePanel ? (
          <aside
            aria-label={formTitle}
            className="grid gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--soft-shadow)]"
          >
            {isFormVisible ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg leading-tight font-extrabold">
                    {formTitle}
                  </h3>
                  {!isCreating && selectedStage ? (
                    <span className="min-w-0 truncate rounded-lg bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                      {selectedStage.code}
                    </span>
                  ) : null}
                </div>
                {form}
              </>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                {t(translations.stages.selectStage)}
              </p>
            )}
          </aside>
        ) : (
          <Sheet
            onOpenChange={(open) => {
              if (!open && !canLeaveForm()) return;
              setIsSheetOpen(open);
              if (!open) setIsCreating(false);
            }}
            open={isSheetOpen && isFormVisible}
          >
            <SheetContent
              className="w-[min(92vw,24rem)] overflow-y-auto"
              side="right"
            >
              <SheetHeader>
                <SheetTitle>{formTitle}</SheetTitle>
                <SheetDescription>
                  {selectedStage && !isCreating
                    ? selectedStage.code
                    : t(translations.stages.description)}
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">{form}</div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </section>
  );
}
