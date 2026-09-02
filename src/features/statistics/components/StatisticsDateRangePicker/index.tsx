import { format } from 'date-fns';
import { CalendarRange } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  const [open, setOpen] = useState(false);
  const selected: DateRange = {
    from: parseDate(from),
    to: parseDate(to),
  };
  const selectedFrom = selected.from ?? new Date();

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-label={label}
          className="w-full justify-start text-left font-normal"
          variant="outline"
        >
          <CalendarRange aria-hidden="true" />
          <span className="truncate">
            {format(selectedFrom, 'dd/MM/yyyy')} —{' '}
            {format(selected.to ?? selectedFrom, 'dd/MM/yyyy')}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          defaultMonth={selectedFrom}
          mode="range"
          numberOfMonths={2}
          onSelect={(range) => {
            onChange(range);
            if (range?.from && range.to) setOpen(false);
          }}
          selected={selected}
        />
      </PopoverContent>
    </Popover>
  );
}
