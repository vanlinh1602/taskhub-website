import {
  BookOpenText,
  CalendarDays,
  ExternalLink,
  FolderOpen,
  Plus,
  Search,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';

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
  useCreateStoryMutation,
  useStoriesQuery,
} from '@/features/stories/hooks';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

export default function StoriesPage() {
  const { i18n, t } = useTranslation();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [query, setQuery] = useState('');
  const storiesQuery = useStoriesQuery(workspaceId, query);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">
            {t(translations.management.eyebrow)}
          </p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t(translations.management.stories.title)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t(translations.management.stories.description)}
          </p>
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
                disabled={createMutation.isPending}
                type="submit"
              >
                {t(translations.management.stories.save)}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-[var(--soft-shadow)]">
        <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t(translations.management.stories.library)}</CardTitle>
            <CardDescription>
              {t(translations.management.stories.libraryDescription, {
                count: storiesQuery.data?.length ?? 0,
              })}
            </CardDescription>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(translations.management.stories.search)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
                    {t(
                      translations.management.stories.emptyStoriesDescription,
                    )}
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
          {storiesQuery.data && storiesQuery.data.length > 0 ? (
            <Table className="min-w-[760px]">
              <TableHeader className="bg-muted/35">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-64">
                    {t(translations.management.stories.name)}
                  </TableHead>
                  <TableHead className="min-w-28">
                    {t(translations.management.stories.status)}
                  </TableHead>
                  <TableHead className="min-w-36">
                    {t(translations.management.stories.createdAt)}
                  </TableHead>
                  <TableHead className="w-20 text-center">
                    {t(translations.management.stories.drive)}
                  </TableHead>
                  <TableHead className="w-48 text-right">
                    {t(translations.management.stories.actions)}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storiesQuery.data.map((story) => (
                  <TableRow className="group align-middle" key={story.id}>
                    <TableCell>
                      <Link
                        className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        to={`/stories/${encodeURIComponent(story.id)}`}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
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
                      <span className="inline-flex items-center gap-2 text-sm font-medium">
                        <span
                          aria-hidden="true"
                          className={`size-2 rounded-full ${story.status === 'ACTIVE' ? 'bg-primary' : 'bg-muted-foreground/50'}`}
                        />
                        {story.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays aria-hidden="true" className="size-3.5" />
                        {dateFormatter.format(new Date(story.createdAt))}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        asChild
                        size="icon-sm"
                        title={t(translations.management.stories.drive)}
                        variant="ghost"
                      >
                        <a
                          href={story.googleDriveUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={t(translations.management.stories.drive)}
                        >
                          <ExternalLink aria-hidden="true" />
                        </a>
                      </Button>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button asChild size="sm">
                        <Link to={`/stories/${encodeURIComponent(story.id)}`}>
                          <FolderOpen aria-hidden="true" />
                          {t(translations.management.stories.viewChapters)}
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
