import {
  BookOpenText,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Plus,
  Search,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ChapterPriority } from '@/features/chapters/types';
import { getPriorityLabel } from '@/features/chapters/utils/chapter-labels';
import {
  useCreateStoryMutation,
  useStoriesQuery,
} from '@/features/stories/hooks';
import { useUpdateStoryPriorityMutation } from '@/features/stories/hooks';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

export default function StoriesPage() {
  const { i18n, t } = useTranslation();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();
  const storiesQuery = useStoriesQuery(workspaceId, query);
  const allStories = useMemo(
    () => storiesQuery.data ?? [],
    [storiesQuery.data],
  );
  const statusTabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const story of allStories) {
      counts.set(story.status, (counts.get(story.status) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [allStories]);
  const stories =
    statusFilter === 'ALL'
      ? allStories
      : allStories.filter((story) => story.status === statusFilter);

  function statusLabel(status: string): string {
    return status === 'ACTIVE'
      ? t(translations.management.stories.statusActive)
      : status;
  }

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }),
    [i18n.language],
  );
  const createMutation = useCreateStoryMutation(workspaceId);

  function submitCreate(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createMutation.mutate(
      {
        title: String(data.get('title') ?? ''),
        alternativeTitle:
          String(data.get('alternativeTitle') ?? '') || undefined,
        folderId: String(data.get('folderId') ?? '') || undefined,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          toast.success(t(translations.management.stories.createStory));
        },
        onError: (error: Error) => toast.error(formatError(error)),
      },
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t(translations.management.stories.title)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(translations.management.stories.libraryDescription, {
              count: storiesQuery.data?.length ?? 0,
            })}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label={t(translations.management.stories.search)}
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(translations.management.stories.search)}
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-[var(--control-shadow)]">
                <Plus />
                {t(translations.management.stories.createStory)}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t(translations.management.stories.createStory)}
                </DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={submitCreate}>
                <div className="space-y-2">
                  <Label htmlFor="story-title">
                    {t(translations.management.stories.name)}
                  </Label>
                  <Input
                    id="story-title"
                    name="title"
                    placeholder={t(translations.management.stories.name)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story-alternative-title">
                    {t(translations.management.stories.alternativeTitle)}
                  </Label>
                  <Input
                    id="story-alternative-title"
                    name="alternativeTitle"
                    placeholder={t(
                      translations.management.stories.alternativeTitle,
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story-folder-id">
                    {t(translations.management.stories.folderId)}
                  </Label>
                  <Input
                    id="story-folder-id"
                    name="folderId"
                    placeholder={t(translations.management.stories.folderId)}
                  />
                </div>
                <Button
                  className="w-full"
                  loading={createMutation.isPending}
                  type="submit"
                >
                  {t(translations.management.stories.save)}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 py-0 shadow-[var(--soft-shadow)]">
        <CardContent className="p-0">
          {statusTabs.length > 1 ? (
            <div
              aria-label={t(translations.management.stories.status)}
              className="flex gap-1 overflow-x-auto border-b border-border/60 px-3 py-2"
              role="tablist"
            >
              {[['ALL', allStories.length] as const, ...statusTabs].map(
                ([key, count]) => (
                  <button
                    aria-selected={statusFilter === key}
                    className={`inline-flex h-9 shrink-0 items-center rounded-lg px-3.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${statusFilter === key ? 'bg-primary/15 text-link' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    role="tab"
                    type="button"
                  >
                    {key === 'ALL'
                      ? t(translations.management.stories.filterAll)
                      : statusLabel(key)}{' '}
                    · {count}
                  </button>
                ),
              )}
            </div>
          ) : null}
          {storiesQuery.isLoading ? (
            <div
              aria-label={t(translations.management.stories.loading)}
              className="space-y-0 px-6 py-2"
              role="status"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  className="flex items-center gap-4 border-b border-border/60 py-4 last:border-b-0"
                  key={`story-skeleton-${index}`}
                >
                  <Skeleton className="h-10 min-w-0 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="hidden h-4 w-28 sm:block" />
                  <Skeleton className="hidden h-9 w-9 sm:block" />
                  <Skeleton className="h-9 w-36" />
                </div>
              ))}
            </div>
          ) : null}
          {storiesQuery.isError ? (
            <div className="p-6">
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {formatError(storiesQuery.error)}
              </p>
            </div>
          ) : null}
          {storiesQuery.data?.length === 0 ? (
            <div className="p-6">
              <Empty className="border-border bg-muted/20 py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpenText />
                  </EmptyMedia>
                  <EmptyTitle>
                    {t(translations.management.stories.emptyStories)}
                  </EmptyTitle>
                  <EmptyDescription>
                    {t(translations.management.stories.emptyStoriesDescription)}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus />
                    {t(translations.management.stories.createStory)}
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : null}
          {stories.length > 0 ? (
            <Table className="min-w-[760px]">
              <TableHeader className="bg-muted/35">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-64">
                    {t(translations.management.stories.name)}
                  </TableHead>
                  <TableHead className="min-w-28">
                    {t(translations.management.stories.status)}
                  </TableHead>
                  <TableHead className="min-w-40">
                    {t(translations.management.stories.priority)}
                  </TableHead>
                  <TableHead className="min-w-36">
                    {t(translations.management.stories.createdAt)}
                  </TableHead>
                  <TableHead className="w-28 text-right">
                    {t(translations.management.stories.actions)}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stories.map((story) => (
                  <TableRow
                    className="group cursor-pointer align-middle"
                    key={story.id}
                    onClick={() =>
                      void navigate(`/stories/${encodeURIComponent(story.id)}`)
                    }
                  >
                    <TableCell>
                      <Link
                        className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        onClick={(event) => event.stopPropagation()}
                        to={`/stories/${encodeURIComponent(story.id)}`}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-link transition-colors group-hover:bg-primary/15">
                          <BookOpenText aria-hidden="true" className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold tracking-tight">
                            {story.title}
                          </span>
                          <span className="mt-1 block truncate text-xs text-muted-foreground">
                            {story.alternativeTitle ??
                              t(
                                translations.management.stories
                                  .noAlternativeTitle,
                              )}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${story.status === 'ACTIVE' ? 'bg-primary/15 text-link' : 'bg-muted text-muted-foreground'}`}
                      >
                        {statusLabel(story.status)}
                      </span>
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <StoryPrioritySelect
                        priority={story.priority}
                        storyId={story.id}
                        workspaceId={workspaceId}
                      />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays aria-hidden="true" className="size-3.5" />
                        {dateFormatter.format(new Date(story.createdAt))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        asChild
                        size="icon"
                        title={t(translations.management.stories.drive)}
                        variant="ghost"
                      >
                        <a
                          onClick={(event) => event.stopPropagation()}
                          href={story.googleDriveUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={t(translations.management.stories.drive)}
                        >
                          <ExternalLink aria-hidden="true" />
                        </a>
                      </Button>
                      <Button
                        asChild
                        className="text-link"
                        size="icon"
                        title={t(translations.management.stories.viewChapters)}
                        variant="ghost"
                      >
                        <Link
                          aria-label={t(
                            translations.management.stories.viewChapters,
                          )}
                          onClick={(event) => event.stopPropagation()}
                          to={`/stories/${encodeURIComponent(story.id)}`}
                        >
                          <ChevronRight aria-hidden="true" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

const storyPriorities: readonly ChapterPriority[] = ['HIGH', 'NORMAL', 'LOW'];

function StoryPrioritySelect({
  priority,
  storyId,
  workspaceId,
}: {
  priority: ChapterPriority;
  storyId: string;
  workspaceId: string;
}) {
  const { t } = useTranslation();
  const mutation = useUpdateStoryPriorityMutation(workspaceId, storyId);

  return (
    <Select
      disabled={mutation.isPending}
      onValueChange={(value) =>
        mutation.mutate(
          { priority: value as ChapterPriority },
          { onError: (error: Error) => toast.error(formatError(error)) },
        )
      }
      value={priority}
    >
      <SelectTrigger aria-label={t(translations.management.stories.priority)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {storyPriorities.map((item) => (
          <SelectItem key={item} value={item}>
            {getPriorityLabel(t, item)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
