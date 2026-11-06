import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import MoneyInput from '@/components/MoneyInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getDescendantIds,
  type WorkflowGraphEdge,
  type WorkflowGraphNode,
} from '@/features/workflows/utils/graph';
import { translations } from '@/locales/translations';
import { formatMoney } from '@/utils/money';

interface StageInspectorProps {
  readonly edges: readonly WorkflowGraphEdge[];
  readonly language: string;
  readonly node: WorkflowGraphNode;
  readonly nodes: readonly WorkflowGraphNode[];
  readonly onDurationChange: (value: string) => void;
  readonly onPrerequisiteChange: (
    sourceId: string,
    isChecked: boolean,
  ) => void;
  readonly onPriceChange: (value: string) => void;
  readonly onRemove: () => void;
  readonly onResetDuration: () => void;
  readonly onResetPrice: () => void;
}

function FieldHint({
  label,
  onReset,
  resetLabel,
}: {
  readonly label: string;
  readonly onReset?: () => void;
  readonly resetLabel: string;
}) {
  return (
    <div className="flex min-h-6 items-center justify-between gap-2 text-xs text-muted-foreground">
      <span>{label}</span>
      {onReset ? (
        <Button onClick={onReset} size="xs" type="button" variant="link">
          {resetLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default function StageInspector({
  edges,
  language,
  node,
  nodes,
  onDurationChange,
  onPrerequisiteChange,
  onPriceChange,
  onRemove,
  onResetDuration,
  onResetPrice,
}: StageInspectorProps) {
  const { t } = useTranslation();
  const { data } = node;
  const stage = data.stageDefinition;
  const blockedIds = getDescendantIds(edges, node.id);
  const otherNodes = nodes.filter((item) => item.id !== node.id);
  const prerequisiteIds = new Set(
    edges.filter((edge) => edge.target === node.id).map((edge) => edge.source),
  );
  const resetLabel = t(translations.workflows.useDefault);

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-2.5">
        <h3 className="min-w-0 text-lg leading-tight font-extrabold">
          {stage.name}
        </h3>
        <span className="min-w-0 truncate rounded-lg bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
          {stage.code}
        </span>
      </div>
      {!stage.isActive ? (
        <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-200">
          {t(translations.workflows.inactiveStage)}
        </p>
      ) : null}

      <fieldset className="grid gap-1.5">
        <legend className="pb-1.5 text-sm font-semibold">
          {t(translations.workflows.runsAfterTitle)}
        </legend>
        {otherNodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t(translations.workflows.noOtherStages)}
          </p>
        ) : null}
        {otherNodes.map((item) => {
          const isBlocked = blockedIds.has(item.id);
          const checkboxId = `prerequisite-${item.id}`;
          return (
            <div className="flex min-h-7 items-center gap-2.5" key={item.id}>
              <Checkbox
                checked={prerequisiteIds.has(item.id)}
                disabled={isBlocked}
                id={checkboxId}
                onCheckedChange={(checked) =>
                  onPrerequisiteChange(item.id, checked === true)
                }
              />
              <Label
                className="min-w-0 flex-1 font-normal peer-disabled:opacity-100"
                htmlFor={checkboxId}
              >
                <span className={isBlocked ? 'text-muted-foreground' : ''}>
                  {item.data.stageDefinition.name}
                </span>
              </Label>
              {isBlocked ? (
                <span className="text-xs whitespace-nowrap text-muted-foreground">
                  {t(translations.workflows.waitingForThis)}
                </span>
              ) : null}
            </div>
          );
        })}
        <p className="text-xs leading-5 text-muted-foreground">
          {prerequisiteIds.size > 0
            ? t(translations.workflows.runsAfterHint)
            : t(translations.workflows.noDependencies)}
        </p>
      </fieldset>

      <div className="grid gap-1.5">
        <Label htmlFor="workflow-stage-duration">
          {t(translations.workflows.durationInput)}
        </Label>
        <Input
          id="workflow-stage-duration"
          min={1}
          onChange={(event) => onDurationChange(event.target.value)}
          type="number"
          value={
            data.durationOverrideEnabled
              ? (data.durationHoursOverride ?? '')
              : stage.defaultDurationHours
          }
        />
        <FieldHint
          label={
            data.durationOverrideEnabled
              ? t(translations.workflows.catalogValue, {
                  value: `${stage.defaultDurationHours} ${t(translations.workflows.hours)}`,
                })
              : t(translations.workflows.catalogDefault)
          }
          onReset={data.durationOverrideEnabled ? onResetDuration : undefined}
          resetLabel={resetLabel}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="workflow-stage-price">
          {t(translations.workflows.priceInput)}
        </Label>
        <MoneyInput
          id="workflow-stage-price"
          language={language}
          onValueChange={onPriceChange}
          value={
            data.priceOverrideEnabled
              ? (data.priceOverride ?? '')
              : stage.defaultPrice
          }
        />
        <FieldHint
          label={
            data.priceOverrideEnabled
              ? t(translations.workflows.catalogValue, {
                  value: formatMoney(
                    stage.defaultPrice,
                    stage.currency,
                    language,
                  ),
                })
              : t(translations.workflows.catalogDefault)
          }
          onReset={data.priceOverrideEnabled ? onResetPrice : undefined}
          resetLabel={resetLabel}
        />
      </div>

      <Button onClick={onRemove} type="button" variant="destructive">
        <Trash2 aria-hidden="true" />
        {t(translations.workflows.removeStage)}
      </Button>
    </div>
  );
}
