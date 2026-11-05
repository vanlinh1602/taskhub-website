import type { useTranslation } from 'react-i18next';

import type {
  ChapterPriority,
  ChapterWorkflowFilter,
  ChapterWorkflowStatus,
} from '@/features/chapters/types';
import { translations } from '@/locales/translations';

export function getWorkflowLabel(
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

export function getPriorityLabel(
  t: ReturnType<typeof useTranslation>['t'],
  priority: ChapterPriority,
): string {
  return priority === 'HIGH'
    ? t(translations.management.stories.priorityHigh)
    : priority === 'LOW'
      ? t(translations.management.stories.priorityLow)
      : t(translations.management.stories.priorityNormal);
}

export function workflowClass(status: ChapterWorkflowStatus | null): string {
  return status === 'COMPLETED'
    ? 'rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-link'
    : status === 'ACTIVE'
      ? 'rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground'
      : status === 'CANCELLED'
        ? 'rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive'
        : 'rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground';
}

export function priorityClass(priority: ChapterPriority): string {
  return priority === 'HIGH'
    ? 'rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive'
    : priority === 'LOW'
      ? 'rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground'
      : 'rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-link';
}
