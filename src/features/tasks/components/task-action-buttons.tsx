import { CheckCircle2, CircleMinus, Settings2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { translations } from '@/locales/translations';

export default function TaskActionButtons({
  compact = false,
  isCompleteDisabled,
  isDeductDisabled,
  onComplete,
  onDeduct,
  onEdit,
}: {
  readonly compact?: boolean;
  readonly isCompleteDisabled: boolean;
  readonly isDeductDisabled: boolean;
  readonly onComplete: () => void;
  readonly onDeduct: () => void;
  readonly onEdit: () => void;
}): ReactNode {
  const { t } = useTranslation();
  const deductMoneyLabel = t(translations.management.stories.deductMoney);
  const editTaskLabel = t(translations.management.stories.editTask);
  const completeTaskLabel = t(translations.management.stories.completeTask);

  return (
    <div
      className={
        compact
          ? 'flex items-center justify-end gap-1'
          : 'flex flex-wrap items-center gap-2'
      }
    >
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
        aria-label={completeTaskLabel}
        className="text-primary hover:bg-primary/10 hover:text-primary"
        disabled={isCompleteDisabled}
        onClick={onComplete}
        size={compact ? 'icon-sm' : 'sm'}
        type="button"
        title={compact ? completeTaskLabel : undefined}
        variant="outline"
      >
        <CheckCircle2 aria-hidden="true" />
        {compact ? null : completeTaskLabel}
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
