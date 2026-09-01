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
import { Link, useNavigate } from 'react-router';
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
  const navigate = useNavigate();
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

      <Card className="border-border/70 shadow-[var(--soft-shadow)]">
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
        <CardContent>
          {storiesQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t(translations.management.stories.loading)}
            </p>
          ) : null}
          {storiesQuery.isError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {formatError(storiesQuery.error)}
            </p>
          ) : null}
          {storiesQuery.data?.length === 0 ? (
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
          ) : null}
          {storiesQuery.data && storiesQuery.data.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {storiesQuery.data.map((story) => (
                <article
                  key={story.id}
                  className="group flex min-h-56 cursor-pointer flex-col rounded-2xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-[var(--soft-shadow)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                  onClick={() =>
                    navigate(`/stories/${encodeURIComponent(story.id)}`)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/stories/${encodeURIComponent(story.id)}`);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpenText aria-hidden="true" className="size-5" />
                    </div>
                    <span
                      className={
                        story.status === 'ACTIVE'
                          ? 'rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary'
                          : 'rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground'
                      }
                    >
                      {story.status}
                    </span>
                  </div>
                  <div className="mt-5 min-w-0">
                    <h3 className="truncate text-lg font-bold tracking-tight">
                      {story.title}
                    </h3>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {story.alternativeTitle ??
                        t(translations.management.stories.noAlternativeTitle)}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays aria-hidden="true" className="size-3.5" />
                      {dateFormatter.format(new Date(story.createdAt))}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        asChild
                        onClick={(event) => event.stopPropagation()}
                        size="icon-sm"
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
                      <Button
                        asChild
                        onClick={(event) => event.stopPropagation()}
                        size="sm"
                      >
                        <Link to={`/stories/${encodeURIComponent(story.id)}`}>
                          <FolderOpen aria-hidden="true" />
                          {t(translations.management.stories.viewChapters)}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
