import { CalendarClock, CheckCircle2, Flag, UserPlus, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import type { TaskBulkMode } from '@/features/tasks/utils';
import { translations } from '@/locales/translations';

export default function TaskBulkActionBar({
  onAction,
  onClear,
  selectedCount,
}: {
  readonly onAction: (mode: TaskBulkMode) => void;
  readonly onClear: () => void;
  readonly selectedCount: number;
}): ReactNode {
  const { t } = useTranslation();
  const bulkT = translations.management.tasks;
  const actions: readonly {
    readonly icon: ReactNode;
    readonly label: string;
    readonly mode: TaskBulkMode;
  }[] = [
    {
      icon: <UserPlus aria-hidden="true" />,
      label: t(bulkT.bulkAssign),
      mode: 'assign',
    },
    {
      icon: <CheckCircle2 aria-hidden="true" />,
      label: t(bulkT.completed),
      mode: 'complete',
    },
    {
      icon: <CalendarClock aria-hidden="true" />,
      label: t(bulkT.bulkDeadline),
      mode: 'deadline',
    },
    {
      icon: <Flag aria-hidden="true" />,
      label: t(bulkT.bulkStatus),
      mode: 'status',
    },
  ];

  return (
    <div
      aria-label={t(bulkT.bulkBarLabel)}
      className="flex flex-wrap items-center gap-2 border-b border-primary/30 bg-primary/10 px-3 py-2.5"
      role="toolbar"
    >
      <span
        aria-live="polite"
        className="mr-auto px-2 text-sm font-semibold whitespace-nowrap"
      >
        {t(bulkT.bulkSelected, { count: selectedCount })}
      </span>
      {actions.map((action) => (
        <Button
          key={action.mode}
          onClick={() => onAction(action.mode)}
          size="sm"
          type="button"
          variant={action.mode === 'complete' ? 'default' : 'outline'}
          className={action.mode === 'complete' ? '' : 'bg-card'}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
      <Button
        aria-label={t(bulkT.bulkClear)}
        onClick={onClear}
        size="icon-sm"
        title={t(bulkT.bulkClear)}
        type="button"
        variant="ghost"
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
