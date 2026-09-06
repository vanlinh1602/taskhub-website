import { ArrowRight, CircleMinus, Settings2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { translations } from '@/locales/translations';

export default function TaskActionButtons({
  compact = false,
  isDeductDisabled,
  onDeduct,
  onEdit,
  viewChapterHref,
}: {
  readonly compact?: boolean;
  readonly isDeductDisabled: boolean;
  readonly onDeduct: () => void;
  readonly onEdit: () => void;
  readonly viewChapterHref?: string;
}): ReactNode {
  const { t } = useTranslation();
  const deductMoneyLabel = t(translations.management.stories.deductMoney);
  const editTaskLabel = t(translations.management.stories.editTask);
  const viewChapterLabel = t(translations.management.stories.viewChapter);

  return (
    <div
      className={
        compact
          ? 'flex items-center justify-end gap-1'
          : 'flex flex-wrap items-center gap-2'
      }
    >
      {viewChapterHref ? (
        <Button
          asChild
          aria-label={viewChapterLabel}
          className="text-primary hover:bg-primary/10 hover:text-primary"
          size={compact ? 'icon-sm' : 'sm'}
          title={compact ? viewChapterLabel : undefined}
          variant="outline"
        >
          <Link to={viewChapterHref}>
            <ArrowRight aria-hidden="true" />
            {compact ? null : viewChapterLabel}
          </Link>
        </Button>
      ) : null}
      <Button
        aria-label={editTaskLabel}
        className="text-primary hover:bg-primary/10 hover:text-primary"
        onClick={onEdit}
        size={compact ? 'icon-sm' : 'sm'}
        type="button"
        title={compact ? editTaskLabel : undefined}
        variant="outline"
      >
        <Settings2 aria-hidden="true" />
        {compact ? null : editTaskLabel}
      </Button>
      <Button
        aria-label={deductMoneyLabel}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={isDeductDisabled}
        onClick={onDeduct}
        size={compact ? 'icon-sm' : 'sm'}
        type="button"
        title={compact ? deductMoneyLabel : undefined}
        variant="outline"
      >
        <CircleMinus aria-hidden="true" />
        {compact ? null : deductMoneyLabel}
      </Button>
    </div>
  );
}
