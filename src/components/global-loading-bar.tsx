import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { translations } from '@/locales/translations';

const SHOW_DELAY_MS = 150;

/**
 * Thin progress bar pinned to the top of the viewport while any query or
 * mutation is in flight. Delayed slightly so instant requests never flicker.
 */
export function GlobalLoadingBar() {
  const { t } = useTranslation();
  const busy = useIsFetching() + useIsMutating() > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!busy) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [busy]);

  if (!visible) return null;

  return (
    <div
      aria-label={t(translations.common.updatingData)}
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-primary/15"
      role="progressbar"
    >
      <div className="h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:w-full motion-reduce:animate-pulse" />
    </div>
  );
}
