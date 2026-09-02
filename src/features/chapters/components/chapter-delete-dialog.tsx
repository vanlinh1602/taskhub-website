import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type {
  Chapter,
  ChapterDeleteBlockReason,
} from '@/features/chapters/types';
import { translations } from '@/locales/translations';

export function ChapterDeleteDialog({
  chapter,
  isPending,
  onConfirm,
  onOpenChange,
}: {
  readonly chapter: Pick<Chapter, 'chapterName' | 'deleteState'> | null;
  readonly isPending: boolean;
  readonly onConfirm: () => void;
  readonly onOpenChange: (open: boolean) => void;
}): ReactNode {
  const { t } = useTranslation();
  const canDelete = chapter?.deleteState.canDelete ?? false;
  const blockedReasons = chapter?.deleteState.blockedReasons ?? [];

  function getBlockedReasonLabel(reason: ChapterDeleteBlockReason): string {
    if (reason === 'PUBLISHED')
      return t(translations.management.stories.chapterDeletePublished);
    if (reason === 'WORKFLOW_FINALIZED')
      return t(translations.management.stories.chapterDeleteWorkflowFinalized);
    if (reason === 'PAYMENT_ACTIVITY')
      return t(translations.management.stories.chapterDeletePaymentActivity);
    return t(translations.management.stories.chapterDeleteTaskActivity);
  }

  return (
    <AlertDialog
      open={chapter !== null}
      onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={
              canDelete
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-muted-foreground'
            }
          >
            <AlertTriangle aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {canDelete
              ? t(translations.management.stories.chapterDeleteTitle)
              : t(translations.management.stories.chapterDeleteBlockedTitle)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {canDelete
              ? t(translations.management.stories.chapterDeleteDescription)
              : t(
                  translations.management.stories
                    .chapterDeleteBlockedDescription,
                )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {chapter ? (
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/40 px-3 py-3">
            <p className="font-semibold">{chapter.chapterName}</p>
            {canDelete ? null : (
              <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
                {blockedReasons.map((reason) => (
                  <li key={reason}>{getBlockedReasonLabel(reason)}</li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              {t(translations.management.stories.chapterDeleteDriveKept)}
            </p>
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {canDelete
              ? t(translations.management.stories.cancel)
              : t(translations.management.stories.close)}
          </AlertDialogCancel>
          {canDelete ? (
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                onConfirm();
              }}
              variant="destructive"
            >
              {isPending ? (
                <RefreshCw aria-hidden="true" className="animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              {t(translations.management.stories.deleteChapter)}
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
