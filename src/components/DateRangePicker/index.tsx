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

export interface DateRangePickerProps {
  readonly label: string;
  readonly onChange: (range: DateRange | undefined) => void;
  readonly placeholder: string;
  readonly value: DateRange | undefined;
}

export default function DateRangePicker({
  label,
  onChange,
  placeholder,
  value,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedFrom = value?.from;
  const selectedLabel = selectedFrom
    ? value?.to
      ? `${format(selectedFrom, 'dd/MM/yyyy')} — ${format(value.to, 'dd/MM/yyyy')}`
      : format(selectedFrom, 'dd/MM/yyyy')
    : placeholder;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-label={label}
          className="w-full justify-start text-left font-normal"
          variant="outline"
        >
          <CalendarRange aria-hidden="true" />
          <span className="truncate">{selectedLabel}</span>
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
          selected={value}
        />
      </PopoverContent>
    </Popover>
  );
}
