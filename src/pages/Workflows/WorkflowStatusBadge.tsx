import { useTranslation } from 'react-i18next';

import type { WorkflowTemplateStatus } from '@/features/workflows/types';
import { cn } from '@/lib/utils';
import { translations } from '@/locales/translations';

const STATUS_TONES: Record<WorkflowTemplateStatus, string> = {
  ACTIVE: 'bg-primary/10 text-link',
  DRAFT: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  INACTIVE: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS = {
  ACTIVE: translations.workflows.active,
  DRAFT: translations.workflows.draft,
  INACTIVE: translations.workflows.inactive,
} as const;

export default function WorkflowStatusBadge({
  status,
}: {
  readonly status: WorkflowTemplateStatus;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        STATUS_TONES[status],
      )}
    >
      {t(STATUS_LABELS[status])}
    </span>
  );
}
