import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { translations } from '@/locales/translations';

/**
 * Wraps already-rendered content and, while `active` (e.g. a background
 * refetch / page change), softly dims it and shows a spinner chip.
 */
export function FetchingOverlay({
  active,
  children,
  className,
}: {
  readonly active: boolean;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div aria-busy={active} className={cn('relative', className)}>
      <div
        className={cn(
          'transition-opacity duration-200',
          active && 'pointer-events-none opacity-60',
        )}
      >
        {children}
      </div>
      {active ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center"
          role="status"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-control">
            <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
            {t(translations.common.updatingData)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Spinner chip for containers that are `relative`. Use alongside an opacity
 * class when the container cannot be wrapped by <FetchingOverlay>.
 */
export function FetchingBadge({ active }: { readonly active: boolean }) {
  const { t } = useTranslation();

  if (!active) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center"
      role="status"
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-control">
        <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
        {t(translations.common.updatingData)}
      </span>
    </div>
  );
}
