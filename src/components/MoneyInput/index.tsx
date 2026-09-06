import type { ComponentProps } from 'react';

import { Input } from '@/components/ui/input';
import { formatMoneyInput, parseMoneyInput } from '@/utils/money';

type MoneyInputProps = Omit<
  ComponentProps<typeof Input>,
  'inputMode' | 'onChange' | 'type' | 'value'
> & {
  readonly language: string;
  readonly onValueChange: (value: string) => void;
  readonly value: string;
};

export default function MoneyInput({
  language,
  onValueChange,
  value,
  ...props
}: MoneyInputProps) {
  return (
    <Input
      {...props}
      inputMode="decimal"
      onChange={(event) =>
        onValueChange(parseMoneyInput(event.target.value, language))
      }
      type="text"
      value={formatMoneyInput(value, language)}
    />
  );
}
