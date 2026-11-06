import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MoneyInput from '@/components/MoneyInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
  Stage,
  StageFormValues,
  StagePayload,
} from '@/features/stages/types';
import { translations } from '@/locales/translations';

interface StageFormProps {
  readonly isPending: boolean;
  readonly language: string;
  readonly onCancel: () => void;
  readonly onDirtyChange: (isDirty: boolean) => void;
  readonly onSubmit: (payload: Omit<StagePayload, 'displayOrder'>) => void;
  readonly stage: Stage | null;
}

export default function StageForm({
  isPending,
  language,
  onCancel,
  onDirtyChange,
  onSubmit,
  stage,
}: StageFormProps) {
  const { t } = useTranslation();
  const initialName = stage?.name ?? '';
  const initialDescription = stage?.description ?? '';
  const initialPrice = stage?.defaultPrice ?? '0';
  const initialDuration = String(stage?.defaultDurationHours ?? 24);
  const initialRewardEligible = stage?.isRewardEligible !== false;
  const baseline = useMemo<StageFormValues>(
    () => ({
      name: initialName,
      description: initialDescription,
      defaultPrice: initialPrice,
      durationHours: initialDuration,
      isRewardEligible: initialRewardEligible,
    }),
    [initialName, initialDescription, initialPrice, initialDuration, initialRewardEligible],
  );
  const [values, setValues] = useState<StageFormValues>(baseline);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isDirty = JSON.stringify(values) !== JSON.stringify(baseline);
  const canSubmit = !isPending && (isDirty || !stage);

  useEffect(() => {
    setValues(baseline);
    setValidationError(null);
  }, [baseline]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  function setValue<Key extends keyof StageFormValues>(
    key: Key,
    value: StageFormValues[Key],
  ): void {
    setValues((current) => ({ ...current, [key]: value }));
    setValidationError(null);
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const name = values.name.trim();
    const defaultPrice = values.defaultPrice.trim();
    const durationHours = Number(values.durationHours);
    if (!name || !defaultPrice) {
      setValidationError(t(translations.stages.invalidRequired));
      return;
    }
    if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(defaultPrice)) {
      setValidationError(t(translations.stages.invalidPrice));
      return;
    }
    if (!Number.isInteger(durationHours) || durationHours < 1) {
      setValidationError(t(translations.stages.invalidWholeNumber));
      return;
    }
    onSubmit({
      defaultPrice,
      description: values.description.trim() || undefined,
      durationHours,
      isRewardEligible: values.isRewardEligible,
      name,
    });
  }

  function cancel(): void {
    setValues(baseline);
    setValidationError(null);
    onCancel();
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-2">
        <Label htmlFor="stage-name">{t(translations.stages.name)}</Label>
        <Input
          id="stage-name"
          maxLength={100}
          onChange={(event) => setValue('name', event.target.value)}
          value={values.name}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="stage-description">
          {t(translations.stages.descriptionField)}
        </Label>
        <Textarea
          id="stage-description"
          onChange={(event) => setValue('description', event.target.value)}
          rows={3}
          value={values.description}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid content-end gap-2">
          <Label htmlFor="stage-duration">
            {t(translations.stages.durationHours)}
          </Label>
          <Input
            id="stage-duration"
            min={1}
            onChange={(event) => setValue('durationHours', event.target.value)}
            type="number"
            value={values.durationHours}
          />
        </div>
        <div className="grid content-end gap-2">
          <Label htmlFor="stage-price">
            {t(translations.stages.defaultPrice)}
          </Label>
          <MoneyInput
            id="stage-price"
            language={language}
            onValueChange={(value) => setValue('defaultPrice', value)}
            value={values.defaultPrice}
          />
        </div>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-muted/60 p-3">
        <Checkbox
          aria-describedby="stage-reward-description"
          checked={values.isRewardEligible}
          id="stage-reward-eligible"
          onCheckedChange={(checked) =>
            setValue('isRewardEligible', checked === true)
          }
        />
        <span className="grid gap-1">
          <span className="text-sm font-semibold">
            {t(translations.stages.rewardEligible)}
          </span>
          <span
            className="text-xs leading-5 text-muted-foreground"
            id="stage-reward-description"
          >
            {t(translations.stages.rewardEligibleDescription)}
          </span>
        </span>
      </label>
      {validationError ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {validationError}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button
          disabled={stage !== null && !isDirty}
          onClick={cancel}
          type="button"
          variant="outline"
        >
          {t(translations.stages.cancel)}
        </Button>
        <Button disabled={!canSubmit} loading={isPending} type="submit">
          {t(translations.stages.save)}
        </Button>
      </div>
    </form>
  );
}
