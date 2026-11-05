import {
  CheckCircle2,
  Circle,
  CreditCard,
  ExternalLink,
  FilePenLine,
  PencilLine,
  Plus,
  Search,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChapterDeleteDialog } from '@/features/chapters/components/chapter-delete-dialog';
import {
  ChapterProgressTable,
  type ChapterTaskReference,
} from '@/features/chapters/components/ChapterProgressTable';
import ChapterPublicationDialog from '@/features/chapters/components/ChapterPublicationDialog';
import {
  useChaptersQuery,
  useCreateChapterMutation,
  useDeleteChapterMutation,
  useNotifyChapterProgressMutation,
  useUpdateChapterConfigurationMutation,
  useUpdateChapterPublicationMutation,
} from '@/features/chapters/hooks';
import type {
  Chapter,
  ChapterDifficulty,
  ChapterPriority,
  ChapterWorkflowFilter,
} from '@/features/chapters/types';
import {
  getPriorityLabel,
  getWorkflowLabel,
} from '@/features/chapters/utils/chapter-labels';
import {
  type ChapterNameSortOrder,
  sortChaptersByName,
} from '@/features/chapters/utils/sort-chapters-by-name';
import {
  type SelectedTask,
  TaskDetail,
} from '@/features/statistics/components/TaskDetail';
import { useStoryStatisticsQuery } from '@/features/statistics/hooks';
import { toTaskActionTarget } from '@/features/statistics/utils/task-action-target';
import {
  useRenameStoryMutation,
  useStoryQuery,
} from '@/features/stories/hooks';
import {
  default as TaskActionDialogs,
  type TaskActionMode,
} from '@/features/tasks/components/task-action-dialogs';
import type { TaskActionTarget } from '@/features/tasks/types';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

const priorities: readonly ChapterPriority[] = ['LOW', 'NORMAL', 'HIGH'];
const difficulties: readonly ChapterDifficulty[] = [
  'NORMAL',
  'HARD',
  'VERY_HARD',
];
const workflows: readonly ChapterWorkflowFilter[] = [
  'ALL',
  'DRAFT',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
];
const publications = ['ALL', 'PUBLISHED', 'UNPUBLISHED'] as const;
type PublicationFilter = (typeof publications)[number];
const chapterNameSortOrders: readonly ChapterNameSortOrder[] = ['ASC', 'DESC'];
const priorityFilters: readonly (ChapterPriority | 'ALL')[] = [
  'ALL',
  ...priorities,
];

function readFilterParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = searchParams.get(key);
  return allowed.find((item) => item === value) ?? fallback;
}

export default function StoryDetailPage(): ReactNode {
  const { i18n, t } = useTranslation();
  const { storyId = '' } = useParams();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const workflow = readFilterParam(searchParams, 'workflow', workflows, 'ALL');
  const publication = readFilterParam(
    searchParams,
    'publication',
    publications,
    'ALL',
  );
  const priority = readFilterParam(
    searchParams,
    'priority',
    priorityFilters,
    'ALL',
  );
  const chapterNameSortOrder = readFilterParam(
    searchParams,
    'sort',
    chapterNameSortOrders,
    'ASC',
  );
  const search = searchParams.get('q') ?? '';
  const [selectedTaskReference, setSelectedTaskReference] =
    useState<ChapterTaskReference | null>(null);
  const [taskAction, setTaskAction] = useState<{
    readonly mode: TaskActionMode;
    readonly target: TaskActionTarget;
  } | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameStoryOpen, setIsRenameStoryOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);
  const [publishingChapter, setPublishingChapter] = useState<Chapter | null>(
    null,
  );
  const [publicationNotificationError, setPublicationNotificationError] =
    useState<string | null>(null);
  const storyQuery = useStoryQuery(workspaceId, storyId);
  const renameStoryMutation = useRenameStoryMutation(workspaceId, storyId);
  const chaptersQuery = useChaptersQuery(workspaceId, storyId, workflow);
  const statisticsQuery = useStoryStatisticsQuery(workspaceId, storyId);
  const chapters = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    const filteredChapters = (chaptersQuery.data ?? []).filter(
      (chapter) =>
        (publication === 'ALL' || chapter.publicationStatus === publication) &&
        (priority === 'ALL' || chapter.priority === priority) &&
        (keyword === '' ||
          chapter.chapterName.toLocaleLowerCase().includes(keyword)),
    );

    return sortChaptersByName(filteredChapters, chapterNameSortOrder);
  }, [chapterNameSortOrder, chaptersQuery.data, priority, publication, search]);
  const storyTotals = useMemo(
    () => ({
      chapters: chaptersQuery.data?.length ?? 0,
      done: (chaptersQuery.data ?? []).reduce(
        (sum, chapter) => sum + chapter.completedTasks,
        0,
      ),
      total: (chaptersQuery.data ?? []).reduce(
        (sum, chapter) => sum + chapter.totalTasks,
        0,
      ),
    }),
    [chaptersQuery.data],
  );
  const selectedTask = useMemo<SelectedTask | null>(() => {
    if (!selectedTaskReference || !statisticsQuery.data) return null;
    const row = statisticsQuery.data.items.find(
      (item) => item.chapterId === selectedTaskReference.chapterId,
    );
    const stage = statisticsQuery.data.columns.find(
      (column) => column.id === selectedTaskReference.stageDefinitionId,
    );
    const cell = row?.stages[selectedTaskReference.stageDefinitionId] ?? null;
    if (!row || !stage || !cell || cell.taskId !== selectedTaskReference.taskId)
      return null;
    return {
      cell,
      chapterName: row.chapterName,
      stage,
      storyTitle: row.storyTitle,
    };
  }, [selectedTaskReference, statisticsQuery.data]);
  const progressMutation = useNotifyChapterProgressMutation(
    workspaceId,
    storyId,
  );
  const createMutation = useCreateChapterMutation(workspaceId, storyId);
  const deleteMutation = useDeleteChapterMutation(workspaceId, storyId);
  const configurationMutation = useUpdateChapterConfigurationMutation(
    workspaceId,
    storyId,
  );
  const publicationMutation = useUpdateChapterPublicationMutation(
    workspaceId,
    storyId,
  );

  function updateFilterParam(
    key: string,
    value: string,
    defaultValue: string,
  ): void {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === defaultValue) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  }

  function changeWorkflow(value: ChapterWorkflowFilter): void {
    updateFilterParam('workflow', value, 'ALL');
  }

  function changePublication(value: PublicationFilter): void {
    updateFilterParam('publication', value, 'ALL');
  }

  function changePriority(value: ChapterPriority | 'ALL'): void {
    updateFilterParam('priority', value, 'ALL');
  }

  function changeSearch(value: string): void {
    updateFilterParam('q', value, '');
  }

  function notifyProgress(chapter: Chapter): void {
    progressMutation.mutate(chapter.id, {
      onSuccess: () =>
        toast.success(t(translations.management.stories.notifyProgressSuccess)),
      onError: (error: Error) => toast.error(formatError(error)),
    });
  }

  function unpublish(chapter: Chapter): void {
    publicationMutation.mutate(
      {
        chapterId: chapter.id,
        publicationStatus: 'UNPUBLISHED',
        notify: false,
      },
      {
        onSuccess: () =>
          toast.success(t(translations.management.stories.unpublished)),
        onError: (error: Error) => toast.error(formatError(error)),
      },
    );
  }

  function openPublication(chapter: Chapter): void {
    setPublicationNotificationError(null);
    setPublishingChapter(chapter);
  }

  function openSelectedTaskAction(mode: TaskActionMode): void {
    if (!selectedTask) return;
    setTaskAction({
      mode,
      target: toTaskActionTarget(selectedTask.cell, selectedTask.stage),
    });
  }

  function changeChapterNameSortOrder(value: ChapterNameSortOrder): void {
    updateFilterParam('sort', value, 'ASC');
  }

  function submitPublication(input: {
    readonly notify?: boolean;
    readonly publicationUrl?: string;
  }): void {
    if (!publishingChapter) return;
    setPublicationNotificationError(null);
    publicationMutation.mutate(
      {
        chapterId: publishingChapter.id,
        publicationStatus: 'PUBLISHED',
        ...input,
      },
      {
        onSuccess: (result) => {
          if (
            result.notificationStatus === 'SENT' ||
            result.notificationStatus === 'NOT_REQUESTED'
          ) {
            setPublishingChapter(null);
            setPublicationNotificationError(null);
            toast.success(
              result.notificationStatus === 'SENT'
                ? t(translations.management.stories.publicationNotificationSent)
                : t(translations.management.stories.publicationSuccess),
            );
            return;
          }
          const message = t(
            result.notificationStatus === 'NOT_CONFIGURED'
              ? translations.management.stories
                  .publicationNotificationNotConfigured
              : translations.management.stories.publicationNotificationFailed,
          );
          setPublicationNotificationError(message);
          toast.error(message);
        },
        onError: (error: Error) => {
          const message = formatError(error);
          setPublicationNotificationError(message);
          toast.error(message);
        },
      },
    );
  }

  function submitDelete(): void {
    if (!deletingChapter) return;
    deleteMutation.mutate(deletingChapter.id, {
      onSuccess: () => {
        setDeletingChapter(null);
        toast.success(t(translations.management.stories.chapterDeleteSuccess));
      },
      onError: (error: Error) => toast.error(formatError(error)),
    });
  }

  function submitCreate(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createMutation.mutate(
      {
        folderId: String(form.get('folderId') ?? ''),
        priority: String(form.get('priority') ?? 'NORMAL') as ChapterPriority,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          toast.success(t(translations.management.stories.createChapter));
        },
        onError: (error: Error) => toast.error(formatError(error)),
      },
    );
  }

  function submitStoryRename(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') ?? '').trim();
    if (!title) {
      toast.error(t(translations.management.stories.storyNameRequired));
      return;
    }

    renameStoryMutation.mutate(
      { title },
      {
        onSuccess: () => {
          setIsRenameStoryOpen(false);
          toast.success(t(translations.management.stories.storyRenameSuccess));
        },
        onError: (error: Error) => toast.error(formatError(error)),
      },
    );
  }

  function submitConfiguration(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!editingChapter) return;
    const form = new FormData(event.currentTarget);
    const chapterName = String(form.get('chapterName') ?? '').trim();
    if (!chapterName) {
      toast.error(t(translations.management.stories.chapterNameRequired));
      return;
    }
    const chapterNameChanged = chapterName !== editingChapter.chapterName;
    configurationMutation.mutate(
      {
        chapterId: editingChapter.id,
        input: {
          chapterName,
          difficulty: String(
            form.get('difficulty') ?? 'NORMAL',
          ) as ChapterDifficulty,
          hasAdultContent: form.get('hasAdultContent') === 'on',
          priority: String(form.get('priority') ?? 'NORMAL') as ChapterPriority,
        },
      },
      {
        onSuccess: () => {
          setEditingChapter(null);
          toast.success(
            t(
              chapterNameChanged
                ? translations.management.stories.chapterRenameSuccess
                : translations.management.stories.save,
            ),
          );
        },
        onError: (error: Error) => toast.error(formatError(error)),
      },
    );
  }

  return (
    <section className="space-y-6">
      {storyQuery.data ? (
        <>
          <nav
            aria-label={t(translations.management.stories.breadcrumbStories)}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Link className="hover:underline" to="/stories">
              {t(translations.management.stories.breadcrumbStories)}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-foreground">
              {storyQuery.data.title}
            </span>
          </nav>
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h2 className="text-3xl font-extrabold tracking-tight">
                {storyQuery.data.title}
              </h2>
              {storyQuery.data.alternativeTitle ? (
                <p className="text-sm text-muted-foreground">
                  {storyQuery.data.alternativeTitle}
                </p>
              ) : null}
              {chaptersQuery.data ? (
                <p className="text-sm text-muted-foreground">
                  {t(translations.statistics.storyMeta, storyTotals)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
          <Dialog
            open={isRenameStoryOpen}
            onOpenChange={setIsRenameStoryOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <PencilLine />
                {t(translations.management.stories.renameStory)}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t(translations.management.stories.renameStory)}
                </DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={submitStoryRename}>
                <div className="space-y-2">
                  <Label htmlFor="story-title">
                    {t(translations.management.stories.name)}
                  </Label>
                  <Input
                    autoComplete="off"
                    defaultValue={storyQuery.data.title}
                    id="story-title"
                    maxLength={255}
                    name="title"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => setIsRenameStoryOpen(false)}
                    type="button"
                    variant="outline"
                  >
                    {t(translations.management.stories.cancel)}
                  </Button>
                  <Button
                    disabled={renameStoryMutation.isPending}
                    type="submit"
                  >
                    {t(translations.management.stories.save)}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button asChild variant="outline">
            <a
              href={storyQuery.data.googleDriveUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink />
              {t(translations.management.stories.openStoryDrive)}
            </a>
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus />
                {t(translations.management.stories.createChapter)}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t(translations.management.stories.createChapter)}
                </DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={submitCreate}>
                <div className="space-y-2">
                  <Label htmlFor="chapter-folder-id">
                    {t(translations.management.stories.chapterFolderId)}
                  </Label>
                  <Input id="chapter-folder-id" name="folderId" required />
                </div>
                <PrioritySelect
                  label={t(translations.management.stories.priority)}
                />
                <Button
                  className="w-full"
                  disabled={createMutation.isPending}
                  type="submit"
                >
                  {t(translations.management.stories.createChapter)}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
            </div>
          </header>
        </>
      ) : null}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-card p-4">
        <div className="min-w-56 flex-[2] space-y-1.5">
          <Label htmlFor="chapter-search">
            {t(translations.management.stories.searchChapter)}
          </Label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              autoComplete="off"
              className="bg-background pl-9"
              id="chapter-search"
              onChange={(event) => changeSearch(event.target.value)}
              placeholder={t(
                translations.management.stories.searchChapterPlaceholder,
              )}
              type="search"
              value={search}
            />
          </div>
        </div>
        <FilterSelect
          id="workflow-filter"
          label={t(translations.management.stories.workflow)}
          value={workflow}
          values={workflows}
          onChange={(value) => changeWorkflow(value as ChapterWorkflowFilter)}
          getLabel={(value) =>
            getWorkflowLabel(t)(value as ChapterWorkflowFilter)
          }
        />
        <FilterSelect
          id="publication-filter"
          label={t(translations.management.stories.publication)}
          value={publication}
          values={publications}
          onChange={(value) => changePublication(value as PublicationFilter)}
          getLabel={(value) =>
            value === 'ALL'
              ? t(translations.management.stories.allPublicationStatuses)
              : value === 'PUBLISHED'
                ? t(translations.management.stories.published)
                : t(translations.management.stories.unpublished)
          }
        />
        <FilterSelect
          id="priority-filter"
          label={t(translations.management.stories.priority)}
          value={priority}
          values={['ALL', ...priorities]}
          onChange={(value) => changePriority(value as ChapterPriority | 'ALL')}
          getLabel={(value) =>
            value === 'ALL'
              ? t(translations.management.stories.allPriorities)
              : getPriorityLabel(t, value as ChapterPriority)
          }
        />
        <FilterSelect
          id="chapter-name-sort"
          label={t(translations.management.stories.sortByChapterName)}
          value={chapterNameSortOrder}
          values={chapterNameSortOrders}
          onChange={(value) =>
            changeChapterNameSortOrder(value as ChapterNameSortOrder)
          }
          getLabel={(value) =>
            value === 'ASC'
              ? t(translations.management.stories.chapterNameAscending)
              : t(translations.management.stories.chapterNameDescending)
          }
        />
      </div>
      {chaptersQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t(translations.management.stories.loading)}
        </p>
      ) : null}
      {chaptersQuery.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {formatError(chaptersQuery.error)}
        </p>
      ) : null}
      {chaptersQuery.data?.length === 0 ? (
        <Empty className="border-border bg-muted/20 py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FilePenLine />
            </EmptyMedia>
            <EmptyTitle>
              {t(translations.management.stories.emptyChapters)}
            </EmptyTitle>
            <EmptyDescription>
              {t(translations.management.stories.emptyChaptersDescription)}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus />
              {t(translations.management.stories.createChapter)}
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}
      {chaptersQuery.data &&
      chaptersQuery.data.length > 0 &&
      chapters.length === 0 ? (
        <Empty className="border-border bg-muted/20 py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FilePenLine />
            </EmptyMedia>
            <EmptyTitle>
              {t(translations.management.stories.emptyFilteredChapters)}
            </EmptyTitle>
            <EmptyDescription>
              {t(
                translations.management.stories
                  .emptyFilteredChaptersDescription,
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      {chapters.length ? (
        <Card className="overflow-hidden">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">
                {t(translations.statistics.progressTitle)}
              </CardTitle>
              <CardDescription>
                {t(translations.statistics.tableDescription)}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  aria-hidden="true"
                  className="size-3.5 text-positive"
                />
                {t(translations.statistics.completed)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CreditCard
                  aria-hidden="true"
                  className="size-3.5 text-positive"
                />
                {t(translations.statistics.paid)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Circle aria-hidden="true" className="size-3.5" />
                {t(translations.statistics.no)}
              </span>
            </div>
          </CardHeader>
          {statisticsQuery.isError ? (
            <p className="px-4 pb-4 text-sm text-destructive">
              {formatError(statisticsQuery.error)}
            </p>
          ) : null}
          <ChapterProgressTable
            chapters={chapters}
            isUpdating={publicationMutation.isPending}
            language={i18n.language}
            onDelete={setDeletingChapter}
            onEdit={setEditingChapter}
            onNotifyProgress={notifyProgress}
            onPublish={openPublication}
            onSelectTask={setSelectedTaskReference}
            onUnpublish={unpublish}
            statistics={statisticsQuery.data}
          />
          <div className="border-t border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            {t(translations.management.stories.chapterCount, {
              count: chapters.length,
            })}
          </div>
        </Card>
      ) : null}
      <Dialog
        open={editingChapter !== null}
        onOpenChange={(open) => !open && setEditingChapter(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(translations.management.stories.chapterConfiguration)}
            </DialogTitle>
          </DialogHeader>
          {editingChapter ? (
            <form className="space-y-4" onSubmit={submitConfiguration}>
              <div className="space-y-2">
                <Label htmlFor="chapter-name">
                  {t(translations.management.stories.chapterName)}
                </Label>
                <Input
                  defaultValue={editingChapter.chapterName}
                  id="chapter-name"
                  maxLength={255}
                  name="chapterName"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapter-difficulty">
                  {t(translations.management.stories.difficulty)}
                </Label>
                <Select
                  defaultValue={editingChapter.difficulty}
                  name="difficulty"
                >
                  <SelectTrigger id="chapter-difficulty" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((item) => (
                      <SelectItem key={item} value={item}>
                        {getDifficultyLabel(t, item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <PrioritySelect
                defaultValue={editingChapter.priority}
                label={t(translations.management.stories.priority)}
              />
              <Label htmlFor="chapter-adult-content">
                <Checkbox
                  id="chapter-adult-content"
                  name="hasAdultContent"
                  defaultChecked={editingChapter.hasAdultContent}
                />
                {t(translations.management.stories.adultContent)}
              </Label>
              <Button
                className="w-full"
                disabled={configurationMutation.isPending}
                type="submit"
              >
                {t(translations.management.stories.save)}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
      <ChapterDeleteDialog
        chapter={deletingChapter}
        isPending={deleteMutation.isPending}
        onConfirm={submitDelete}
        onOpenChange={(open) => !open && setDeletingChapter(null)}
      />
      <Dialog
        onOpenChange={(open) => {
          if (!open) setSelectedTaskReference(null);
        }}
        open={selectedTask !== null}
      >
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-lg">
          {selectedTask ? (
            <TaskDetail
              language={i18n.language}
              onComplete={() => openSelectedTaskAction('complete')}
              onDeduct={() => openSelectedTaskAction('deduct')}
              onEdit={() => openSelectedTaskAction('edit')}
              selected={selectedTask}
              t={t}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <TaskActionDialogs
        mode={taskAction?.mode ?? null}
        onOpenChange={(open) => {
          if (!open) setTaskAction(null);
        }}
        target={taskAction?.target ?? null}
        workspaceId={workspaceId}
      />
      <ChapterPublicationDialog
        chapter={publishingChapter}
        errorMessage={publicationNotificationError}
        isPending={publicationMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setPublishingChapter(null);
            setPublicationNotificationError(null);
          }
        }}
        onSubmit={submitPublication}
      />
    </section>
  );
}

function FilterSelect({
  id,
  label,
  value,
  values,
  onChange,
  getLabel,
}: {
  id: string;
  label: string;
  value: string;
  values: readonly string[];
  onChange: (value: string) => void;
  getLabel: (value: string) => string;
}): ReactNode {
  return (
    <div className="min-w-40 flex-1 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {values.map((item) => (
            <SelectItem key={item} value={item}>
              {getLabel(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PrioritySelect({
  label,
  defaultValue = 'NORMAL',
}: {
  label: string;
  defaultValue?: ChapterPriority;
}): ReactNode {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select defaultValue={defaultValue} name="priority">
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {priorities.map((item) => (
            <SelectItem key={item} value={item}>
              {getPriorityLabel(t, item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function getDifficultyLabel(
  t: ReturnType<typeof useTranslation>['t'],
  difficulty: ChapterDifficulty,
): string {
  return difficulty === 'VERY_HARD'
    ? t(translations.management.stories.difficultyVeryHard)
    : difficulty === 'HARD'
      ? t(translations.management.stories.difficultyHard)
      : t(translations.management.stories.difficultyNormal);
}
