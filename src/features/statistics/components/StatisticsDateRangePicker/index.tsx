import type { DateRange } from 'react-day-picker';

import DateRangePicker from '@/components/DateRangePicker';

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export interface StatisticsDateRangePickerProps {
  readonly from: string;
  readonly to: string;
  readonly label: string;
  readonly onChange: (range: DateRange | undefined) => void;
}

export function StatisticsDateRangePicker({
  from,
  to,
  label,
  onChange,
}: StatisticsDateRangePickerProps) {
  const value: DateRange = { from: parseDate(from), to: parseDate(to) };
  return (
    <DateRangePicker
      label={label}
      onChange={onChange}
      placeholder={label}
      value={value}
    />
  );
}
