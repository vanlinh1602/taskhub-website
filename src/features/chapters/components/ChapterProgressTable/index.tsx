import { CreditCard, ExternalLink, Settings2, Upload } from 'lucide-react';
import { type ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChapterActionsMenu } from '@/features/chapters/components/chapter-actions-menu';
import type { Chapter } from '@/features/chapters/types';
import {
  getPriorityLabel,
  getWorkflowLabel,
  priorityClass,
  workflowClass,
} from '@/features/chapters/utils/chapter-labels';
import {
  StateChip,
  StatusMark,
  TaskStatusChip,
} from '@/features/statistics/components/StateChip';
import type {
  StatisticsChapterRow,
  StatisticsResult,
} from '@/features/statistics/types';
import { statusLabel } from '@/features/statistics/utils/labels';
import { translations } from '@/locales/translations';
import { formatMoney } from '@/utils/money';

const CHAPTER_COLUMN_WIDTH = '26.25rem';
const STAGE_COLUMN_WIDTH = '12.5rem';

export interface ChapterTaskReference {
  readonly chapterId: string;
  readonly stageDefinitionId: string;
  readonly taskId: string;
}

interface ChapterProgressTableProps {
  readonly chapters: readonly Chapter[];
  readonly isUpdating: boolean;
  readonly language: string;
  readonly onDelete: (chapter: Chapter) => void;
  readonly onEdit: (chapter: Chapter) => void;
  readonly onNotifyProgress: (chapter: Chapter) => void;
  readonly onPublish: (chapter: Chapter) => void;
  readonly onSelectTask: (reference: ChapterTaskReference) => void;
  readonly onUnpublish: (chapter: Chapter) => void;
  readonly statistics: StatisticsResult | undefined;
}

function progressOf(chapter: Chapter): number {
  return chapter.totalTasks
    ? Math.round((chapter.completedTasks / chapter.totalTasks) * 100)
    : 0;
}

export function ChapterProgressTable({
  chapters,
  isUpdating,
  language,
  onDelete,
  onEdit,
  onNotifyProgress,
  onPublish,
  onSelectTask,
  onUnpublish,
  statistics,
}: ChapterProgressTableProps): ReactNode {
  const { t } = useTranslation();
  const columns = statistics?.columns ?? [];
  const rowsByChapter = useMemo(() => {
    const map = new Map<string, StatisticsChapterRow>();
    statistics?.items.forEach((item) => map.set(item.chapterId, item));
    return map;
  }, [statistics]);
  const headClass =
    'h-11 border-b border-border/70 bg-muted/60 px-4 text-xs font-bold tracking-[0.08em] whitespace-normal text-foreground uppercase border-l';

  return (
    <div className="max-w-full border-t border-border/70">
      <Table className="w-max min-w-full table-fixed border-separate border-spacing-0">
        <colgroup>
          <col style={{ width: CHAPTER_COLUMN_WIDTH }} />
          {columns.map((column) => (
            <col key={column.id} style={{ width: STAGE_COLUMN_WIDTH }} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead
              className="sticky left-0 z-30 h-11 border-r border-b border-border/70 bg-muted px-5 text-xs font-bold tracking-[0.08em] text-foreground uppercase"
              style={{ width: CHAPTER_COLUMN_WIDTH }}
            >
              {t(translations.statistics.chapterColumn)}
            </TableHead>
            {columns.map((column) => (
              <TableHead className={headClass} key={column.id}>
                {column.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {chapters.map((chapter) => {
            const progress = progressOf(chapter);
            const published = chapter.publicationStatus === 'PUBLISHED';
            const statisticsRow = rowsByChapter.get(String(chapter.id));
            return (
              <TableRow className="hover:bg-transparent" key={chapter.id}>
                <TableCell
                  className="sticky left-0 z-20 border-r border-b border-border/60 bg-card px-5 py-3 align-middle"
                  style={{ width: CHAPTER_COLUMN_WIDTH }}
                >
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="truncate text-sm font-semibold text-link"
                          title={chapter.chapterName}
                        >
                          {chapter.chapterName}
                        </span>
                        {chapter.hasAdultContent ? (
                          <span className="shrink-0 text-xs font-medium text-destructive">
                            {t(translations.management.stories.adultContent)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center">
                        <Button
                          aria-label={t(
                            translations.management.stories.editChapter,
                          )}
                          onClick={() => onEdit(chapter)}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <Settings2 aria-hidden="true" />
                        </Button>
                        {chapter.googleDriveUrl ? (
                          <Button asChild size="icon-sm" variant="ghost">
                            <a
                              aria-label={t(
                                translations.management.stories.drive,
                              )}
                              href={chapter.googleDriveUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <ExternalLink aria-hidden="true" />
                            </a>
                          </Button>
                        ) : null}
                        <ChapterActionsMenu
                          onDelete={() => onDelete(chapter)}
                          onNotifyProgress={() => onNotifyProgress(chapter)}
                          onUnpublish={
                            published ? () => onUnpublish(chapter) : undefined
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={workflowClass(chapter.workflowStatus)}>
                        {getWorkflowLabel(t)(chapter.workflowStatus ?? 'ALL')}
                      </span>
                      <span className={priorityClass(chapter.priority)}>
                        {getPriorityLabel(t, chapter.priority)}
                      </span>
                    </div>
                    <div className="flex min-h-8 items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <div
                          aria-label={t(
                            translations.statistics.chapterProgress,
                          )}
                          aria-valuemax={100}
                          aria-valuemin={0}
                          aria-valuenow={progress}
                          className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-border"
                          role="progressbar"
                        >
                          <div
                            className={`h-full rounded-full ${progress === 100 ? 'bg-positive' : 'bg-primary'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold whitespace-nowrap tabular-nums">
                          {progress}%{' '}
                          <span className="font-medium text-muted-foreground">
                            · {chapter.completedTasks}/{chapter.totalTasks}
                          </span>
                        </span>
                      </div>
                      {published ? (
                        <span className="flex shrink-0 items-center gap-1">
                          <StatusMark
                            done
                            label={t(translations.management.stories.published)}
                          />
                          {chapter.publicationUrl ? (
                            <a
                              aria-label={t(
                                translations.statistics.openPublication,
                              )}
                              className="inline-flex size-8 items-center justify-center rounded-md text-link hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                              href={chapter.publicationUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <ExternalLink
                                aria-hidden="true"
                                className="size-3.5"
                              />
                            </a>
                          ) : null}
                        </span>
                      ) : (
                        <Button
                          aria-label={`${t(translations.statistics.quickPublish)}: ${chapter.chapterName}`}
                          className="shrink-0"
                          disabled={isUpdating}
                          onClick={() => onPublish(chapter)}
                          size="sm"
                          variant="outline"
                        >
                          <Upload aria-hidden="true" />
                          {t(translations.statistics.quickPublish)}
                        </Button>
                      )}
                    </div>
                  </div>
                </TableCell>
                {columns.map((column) => {
                  const cell = statisticsRow?.stages[column.id] ?? null;
                  if (!cell) {
                    return (
                      <TableCell
                        className="border-b border-l border-border/60 p-1 align-middle"
                        key={`${chapter.id}-${column.id}`}
                      >
                        <span
                          aria-label={t(translations.statistics.emptyCell)}
                          className="flex min-h-21 items-center px-3 text-sm text-muted-foreground"
                        >
                          —
                        </span>
                      </TableCell>
                    );
                  }
                  const amount = formatMoney(
                    cell.agreedPrice,
                    cell.currency,
                    language,
                  );
                  const assignee =
                    cell.assigneeDisplayName ??
                    cell.assigneeDiscordUserId ??
                    t(translations.statistics.unassigned);
                  const isUnassigned =
                    !cell.assigneeDisplayName && !cell.assigneeDiscordUserId;
                  return (
                    <TableCell
                      className="border-b border-l border-border/60 p-1 align-middle"
                      key={`${chapter.id}-${column.id}`}
                    >
                      <button
                        aria-label={`${column.name}: ${amount}, ${assignee}`}
                        className="flex min-h-21 w-full flex-col items-start justify-center gap-1.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        onClick={() =>
                          onSelectTask({
                            chapterId: String(chapter.id),
                            stageDefinitionId: column.id,
                            taskId: cell.taskId,
                          })
                        }
                        type="button"
                      >
                        <span className="text-sm font-bold tabular-nums">
                          {amount}
                        </span>
                        <span
                          className={`max-w-full truncate text-xs font-medium text-muted-foreground ${isUnassigned ? 'italic' : ''}`}
                        >
                          {assignee}
                        </span>
                        <span className="flex flex-nowrap gap-1 whitespace-nowrap">
                          <TaskStatusChip
                            label={statusLabel(cell.taskStatus, t)}
                            status={cell.taskStatus}
                          />
                          <StateChip
                            doneLabel={t(translations.statistics.chipPaid)}
                            icon={CreditCard}
                            isDone={cell.paymentStatus === 'PAID'}
                            pendingLabel={t(
                              translations.statistics.chipNotPaid,
                            )}
                          />
                        </span>
                      </button>
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
