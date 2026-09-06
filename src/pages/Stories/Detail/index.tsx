import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FilePenLine,
  Plus,
  Settings2,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChapterActionsMenu } from '@/features/chapters/components/chapter-actions-menu';
import { ChapterDeleteDialog } from '@/features/chapters/components/chapter-delete-dialog';
import ChapterPublicationDialog from '@/features/chapters/components/ChapterPublicationDialog';
import {
  useChaptersQuery,
  useCreateChapterMutation,
  useDeleteChapterMutation,
  useUpdateChapterConfigurationMutation,
  useUpdateChapterPublicationMutation,
} from '@/features/chapters/hooks';
import type {
  Chapter,
  ChapterDifficulty,
  ChapterPriority,
  ChapterWorkflowFilter,
  ChapterWorkflowStatus,
} from '@/features/chapters/types';
import { useStoryQuery } from '@/features/stories/hooks';
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
const chapterPageSize = 25;

export default function StoryDetailPage(): ReactNode {
  const { t } = useTranslation();
  const { storyId = '' } = useParams();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const [page, setPage] = useState(0);
  const [workflow, setWorkflow] = useState<ChapterWorkflowFilter>('ALL');
  const [publication, setPublication] = useState<PublicationFilter>('ALL');
  const [priority, setPriority] = useState<ChapterPriority | 'ALL'>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);
  const [publishingChapter, setPublishingChapter] = useState<Chapter | null>(
    null,
  );
  const [publicationNotificationError, setPublicationNotificationError] =
    useState<string | null>(null);
  const storyQuery = useStoryQuery(workspaceId, storyId);
  const chaptersQuery = useChaptersQuery(
    workspaceId,
    storyId,
    workflow,
    page,
  );
  const chapters = useMemo(
    () =>
      (chaptersQuery.data?.items ?? []).filter(
        (chapter) =>
          (publication === 'ALL' ||
            chapter.publicationStatus === publication) &&
          (priority === 'ALL' || chapter.priority === priority),
      ),
    [chaptersQuery.data, priority, publication],
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

  function changeWorkflow(value: ChapterWorkflowFilter): void {
    setWorkflow(value);
    setPage(0);
  }

  function changePublication(value: PublicationFilter): void {
    setPublication(value);
    setPage(0);
  }

  function changePriority(value: ChapterPriority | 'ALL'): void {
    setPriority(value);
    setPage(0);
  }

  function togglePublication(chapter: Chapter): void {
    if (chapter.publicationStatus === 'UNPUBLISHED') {
      setPublicationNotificationError(null);
      setPublishingChapter(chapter);
      return;
    }
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

  function submitPublication(
    input: { readonly notify?: boolean; readonly publicationUrl?: string },
  ): void {
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
        const currentPage = chaptersQuery.data?.page ?? page;
        const remainingTotal = Math.max(
          0,
          (chaptersQuery.data?.total ?? 0) - 1,
        );
        const remainingPageCount = Math.max(
          1,
          Math.ceil(remainingTotal / chapterPageSize),
        );
        setDeletingChapter(null);
        setPage(Math.min(currentPage, remainingPageCount - 1));
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

  function submitConfiguration(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!editingChapter) return;
    const form = new FormData(event.currentTarget);
    configurationMutation.mutate(
      {
        chapterId: editingChapter.id,
        input: {
          difficulty: String(form.get('difficulty') ?? 'NORMAL') as ChapterDifficulty,
          hasAdultContent: form.get('hasAdultContent') === 'on',
          priority: String(form.get('priority') ?? 'NORMAL') as ChapterPriority,
        },
      },
      {
        onSuccess: () => {
          setEditingChapter(null);
          toast.success(t(translations.management.stories.save));
        },
        onError: (error: Error) => toast.error(formatError(error)),
      },
    );
  }

  return (
    <section className="space-y-6">
      {storyQuery.data ? (
        <div className="rounded-3xl border border-primary/15 bg-linear-to-br from-primary/12 via-card to-card p-5 shadow-[var(--soft-shadow)] sm:p-8">
          <p className="text-sm font-semibold text-primary">
            {t(translations.management.stories.storyWorkspace)}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                {storyQuery.data.title}
              </h2>
              {storyQuery.data.alternativeTitle ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {storyQuery.data.alternativeTitle}
                </p>
              ) : null}
            </div>
            <Button asChild size="sm" variant="outline">
              <a
                href={storyQuery.data.googleDriveUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink />
                {t(translations.management.stories.openStoryDrive)}
              </a>
            </Button>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3">
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
      {chaptersQuery.data?.items.length === 0 ? (
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
      chaptersQuery.data.items.length > 0 &&
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
        <>
          <ChapterTable
            chapters={chapters}
            onDelete={setDeletingChapter}
            onEdit={setEditingChapter}
            onTogglePublication={togglePublication}
            isUpdating={publicationMutation.isPending}
            storyId={storyId}
          />
          <div className="grid gap-3 lg:hidden">
            {chapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                onDelete={() => setDeletingChapter(chapter)}
                onEdit={() => setEditingChapter(chapter)}
                onTogglePublication={() => togglePublication(chapter)}
                isUpdating={publicationMutation.isPending}
                storyId={storyId}
              />
            ))}
          </div>
        </>
      ) : null}
      {chaptersQuery.data && chaptersQuery.data.pageCount > 1 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t(translations.management.stories.pageSummary, {
              current: chaptersQuery.data.page + 1,
              total: chaptersQuery.data.pageCount,
              count: chaptersQuery.data.total,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              disabled={
                chaptersQuery.data.page === 0 || chaptersQuery.isFetching
              }
              onClick={() => setPage((value) => value - 1)}
              size="sm"
              variant="outline"
            >
              <ChevronLeft />
              {t(translations.management.stories.previousPage)}
            </Button>
            <Button
              disabled={
                chaptersQuery.data.page + 1 >= chaptersQuery.data.pageCount ||
                chaptersQuery.isFetching
              }
              onClick={() => setPage((value) => value + 1)}
              size="sm"
              variant="outline"
            >
              {t(translations.management.stories.nextPage)}
              <ChevronRight />
            </Button>
          </div>
        </div>
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

function ChapterTable({
  chapters,
  onDelete,
  onEdit,
  onTogglePublication,
  isUpdating,
  storyId,
}: {
  chapters: readonly Chapter[];
  onDelete: (chapter: Chapter) => void;
  onEdit: (chapter: Chapter) => void;
  onTogglePublication: (chapter: Chapter) => void;
  isUpdating: boolean;
  storyId: string;
}): ReactNode {
  const { t } = useTranslation();
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card lg:block">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>
              {t(translations.management.stories.chapterName)}
            </TableHead>
            <TableHead>{t(translations.management.stories.workflow)}</TableHead>
            <TableHead>{t(translations.management.stories.priority)}</TableHead>
            <TableHead>
              {t(translations.management.stories.taskProgress)}
            </TableHead>
            <TableHead>
              {t(translations.management.stories.publication)}
            </TableHead>
            <TableHead className="text-right">
              {t(translations.management.stories.actions)}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chapters.map((chapter) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              onDelete={() => onDelete(chapter)}
              onEdit={() => onEdit(chapter)}
              onTogglePublication={() => onTogglePublication(chapter)}
              isUpdating={isUpdating}
              storyId={storyId}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ChapterRow({
  chapter,
  onDelete,
  onEdit,
  onTogglePublication,
  isUpdating,
  storyId,
}: {
  chapter: Chapter;
  onDelete: () => void;
  onEdit: () => void;
  onTogglePublication: () => void;
  isUpdating: boolean;
  storyId: string;
}): ReactNode {
  const { t } = useTranslation();
  const progress = progressOf(chapter);
  const published = chapter.publicationStatus === 'PUBLISHED';
  return (
    <TableRow>
      <TableCell>
        <Link
          className="font-semibold text-primary underline-offset-4 hover:underline"
          to={getChapterDetailPath(storyId, chapter.id)}
        >
          {chapter.chapterName}
        </Link>
        {chapter.hasAdultContent ? (
          <p className="text-xs font-medium text-destructive">
            {t(translations.management.stories.adultContent)}
          </p>
        ) : null}
      </TableCell>
      <TableCell>
        <Badge className={workflowClass(chapter.workflowStatus)}>
          {getWorkflowLabel(t)(chapter.workflowStatus ?? 'ALL')}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={priorityClass(chapter.priority)}>
          {getPriorityLabel(t, chapter.priority)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="min-w-28">
          <div className="flex justify-between text-xs">
            <span>
              {chapter.completedTasks}/{chapter.totalTasks}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span
          className={
            published
              ? 'text-xs font-semibold text-primary'
              : 'text-xs font-semibold text-muted-foreground'
          }
        >
          {published
            ? t(translations.management.stories.published)
            : t(translations.management.stories.unpublished)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button asChild size="sm" variant="ghost">
            <Link to={getChapterDetailPath(storyId, chapter.id)}>
              <ArrowRight />
              {t(translations.management.stories.viewChapter)}
            </Link>
          </Button>
          <Button
            aria-label={t(translations.management.stories.editChapter)}
            onClick={onEdit}
            size="icon-sm"
            variant="ghost"
          >
            <Settings2 />
          </Button>
          {chapter.googleDriveUrl ? (
            <Button asChild size="icon-sm" variant="ghost">
              <a
                href={chapter.googleDriveUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={t(translations.management.stories.drive)}
              >
                <ExternalLink />
              </a>
            </Button>
          ) : null}
          <Button
            disabled={isUpdating}
            onClick={onTogglePublication}
            size="sm"
            variant="outline"
          >
            {published
              ? t(translations.management.stories.unpublish)
              : t(translations.management.stories.publish)}
          </Button>
          <ChapterActionsMenu onDelete={onDelete} />
        </div>
      </TableCell>
    </TableRow>
  );
}

function ChapterCard({
  chapter,
  onDelete,
  onEdit,
  onTogglePublication,
  isUpdating,
  storyId,
}: {
  chapter: Chapter;
  onDelete: () => void;
  onEdit: () => void;
  onTogglePublication: () => void;
  isUpdating: boolean;
  storyId: string;
}): ReactNode {
  const { t } = useTranslation();
  const published = chapter.publicationStatus === 'PUBLISHED';
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate">
            <Link
              className="text-primary underline-offset-4 hover:underline"
              to={getChapterDetailPath(storyId, chapter.id)}
            >
              {chapter.chapterName}
            </Link>
          </CardTitle>
          <CardDescription className="mt-1 flex flex-wrap gap-2">
            <Badge className={workflowClass(chapter.workflowStatus)}>
              {getWorkflowLabel(t)(chapter.workflowStatus ?? 'ALL')}
            </Badge>
            <Badge className={priorityClass(chapter.priority)}>
              {getPriorityLabel(t, chapter.priority)}
            </Badge>
          </CardDescription>
        </div>
        <Button
          aria-label={t(translations.management.stories.editChapter)}
          onClick={onEdit}
          size="icon-sm"
          variant="ghost"
        >
          <Settings2 />
        </Button>
        <ChapterActionsMenu onDelete={onDelete} />
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          {t(translations.management.stories.completedTasks, {
            completed: chapter.completedTasks,
            total: chapter.totalTasks,
          })}
        </p>
        <div className="mt-4 flex justify-between border-t pt-4">
          <Button asChild size="sm" variant="ghost">
            <Link to={getChapterDetailPath(storyId, chapter.id)}>
              <ArrowRight />
              {t(translations.management.stories.viewChapter)}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">
              {published
                ? t(translations.management.stories.published)
                : t(translations.management.stories.unpublished)}
            </span>
            <Button
              disabled={isUpdating}
              onClick={onTogglePublication}
              size="sm"
              variant="outline"
            >
              {published
                ? t(translations.management.stories.unpublish)
                : t(translations.management.stories.publish)}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Badge({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}): ReactNode {
  return <span className={className}>{children}</span>;
}

function progressOf(chapter: Chapter): number {
  return chapter.totalTasks
    ? Math.round((chapter.completedTasks / chapter.totalTasks) * 100)
    : 0;
}

function getWorkflowLabel(
  t: ReturnType<typeof useTranslation>['t'],
): (status: ChapterWorkflowFilter) => string {
  return (status) =>
    status === 'DRAFT'
      ? t(translations.management.stories.workflowDraft)
      : status === 'ACTIVE'
        ? t(translations.management.stories.workflowActive)
        : status === 'COMPLETED'
          ? t(translations.management.stories.workflowCompleted)
          : status === 'CANCELLED'
            ? t(translations.management.stories.workflowCancelled)
            : status === 'ALL'
              ? t(translations.management.stories.allWorkflows)
              : t(translations.management.stories.workflowUnset);
}

function getPriorityLabel(
  t: ReturnType<typeof useTranslation>['t'],
  priority: ChapterPriority,
): string {
  return priority === 'HIGH'
    ? t(translations.management.stories.priorityHigh)
    : priority === 'LOW'
      ? t(translations.management.stories.priorityLow)
      : t(translations.management.stories.priorityNormal);
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

function workflowClass(status: ChapterWorkflowStatus | null): string {
  return status === 'COMPLETED'
    ? 'rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary'
    : status === 'ACTIVE'
      ? 'rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground'
      : status === 'CANCELLED'
        ? 'rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive'
        : 'rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground';
}

function priorityClass(priority: ChapterPriority): string {
  return priority === 'HIGH'
    ? 'rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive'
    : priority === 'LOW'
      ? 'rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground'
      : 'rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary';
}

function getChapterDetailPath(storyId: string, chapterId: string): string {
  return `/stories/${encodeURIComponent(storyId)}/chapter/${encodeURIComponent(chapterId)}`;
}
