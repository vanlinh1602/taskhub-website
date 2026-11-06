import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { Stage } from '@/features/stages/types';
import { cn } from '@/lib/utils';
import { translations } from '@/locales/translations';
import { formatMoney } from '@/utils/money';

interface StageRowProps {
  readonly canMoveDown: boolean;
  readonly canMoveUp: boolean;
  readonly isReorderable: boolean;
  readonly isSelected: boolean;
  readonly isStatusPending: boolean;
  readonly onMove: (stage: Stage, offset: number) => void;
  readonly onSelect: (stage: Stage) => void;
  readonly onToggle: (stage: Stage) => void;
  readonly position: number;
  readonly stage: Stage;
}

export default function StageRow({
  canMoveDown,
  canMoveUp,
  isReorderable,
  isSelected,
  isStatusPending,
  onMove,
  onSelect,
  onToggle,
  position,
  stage,
}: StageRowProps) {
  const { i18n, t } = useTranslation();
  const isRewardEligible = stage.isRewardEligible !== false;
  const valueTone = stage.isActive ? 'text-foreground' : 'text-muted-foreground';

  return (
    <li
      className={cn(
        'flex items-stretch border-t border-border/70 first:border-t-0',
        isSelected && 'bg-secondary',
      )}
    >
      {isReorderable ? (
        <div className="flex flex-col justify-center gap-0.5 py-1.5 pl-2.5">
          <Button
            aria-label={`${t(translations.stages.moveUp)}: ${stage.name}`}
            disabled={!canMoveUp}
            onClick={() => onMove(stage, -1)}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <ChevronUp aria-hidden="true" />
          </Button>
          <Button
            aria-label={`${t(translations.stages.moveDown)}: ${stage.name}`}
            disabled={!canMoveDown}
            onClick={() => onMove(stage, 1)}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <ChevronDown aria-hidden="true" />
          </Button>
        </div>
      ) : null}
      <button
        aria-current={isSelected ? 'true' : undefined}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1.5 p-3 text-left transition-colors outline-none hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
        onClick={() => onSelect(stage)}
        type="button"
      >
        <span className="flex min-w-0 flex-[1_1_10rem] items-center gap-3">
          <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground">
            {position}
          </span>
          <span className="min-w-0">
            <span className={cn('block truncate font-bold', valueTone)}>
              {stage.name}
            </span>
            <span className="block truncate font-mono text-xs text-muted-foreground">
              {stage.code}
            </span>
          </span>
        </span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:shrink-0 sm:gap-4">
          <span className={cn('sm:w-14 sm:text-right', valueTone)}>
            {stage.defaultDurationHours} {t(translations.stages.hoursShort)}
          </span>
          <span className={cn('font-semibold sm:w-28 sm:text-right', valueTone)}>
            {formatMoney(stage.defaultPrice, stage.currency, i18n.language)}
          </span>
          <span className="flex sm:w-28 sm:justify-end">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
                isRewardEligible
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {isRewardEligible
                ? t(translations.stages.rewardEnabled)
                : t(translations.stages.rewardDisabled)}
            </span>
          </span>
        </span>
      </button>
      <div className="flex w-30 shrink-0 items-center justify-end gap-2 pr-4">
        <span
          className={cn(
            'text-xs font-semibold whitespace-nowrap',
            stage.isActive ? 'text-link' : 'text-muted-foreground',
          )}
        >
          {stage.isActive
            ? t(translations.stages.active)
            : t(translations.stages.inactive)}
        </span>
        <Switch
          aria-label={`${stage.isActive ? t(translations.stages.deactivate) : t(translations.stages.activate)}: ${stage.name}`}
          checked={stage.isActive}
          disabled={isStatusPending}
          onCheckedChange={() => onToggle(stage)}
        />
      </div>
    </li>
  );
}
