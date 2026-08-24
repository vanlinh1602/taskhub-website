import * as React from 'react';

import { cn } from '@/lib/utils';

function Table({
  className,
  ...props
}: React.ComponentProps<'table'>): React.ReactNode {
  return (
    <div className="relative w-full overflow-x-auto">
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({
  className,
  ...props
}: React.ComponentProps<'thead'>): React.ReactNode {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

function TableBody({
  className,
  ...props
}: React.ComponentProps<'tbody'>): React.ReactNode {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  );
}

function TableRow({
  className,
  ...props
}: React.ComponentProps<'tr'>): React.ReactNode {
  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({
  className,
  ...props
}: React.ComponentProps<'th'>): React.ReactNode {
  return (
    <th
      className={cn(
        'h-11 px-4 text-left align-middle text-xs font-semibold text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  ...props
}: React.ComponentProps<'td'>): React.ReactNode {
  return (
    <td
      className={cn(
        'p-4 align-middle [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  );
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
