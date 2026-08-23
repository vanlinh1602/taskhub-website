import { useTranslation } from 'react-i18next';

import { translations } from '@/locales/translations';

export function LoadingScreen() {
  const { t } = useTranslation();

  return (
    <div className="app-canvas grid min-h-dvh place-items-center text-foreground" role="status">
      <div className="flex items-center gap-3 text-sm font-medium">
        <img className="size-8 animate-pulse rounded-xl shadow-control" src="/assets/brand/banana-bud-logo.png" alt="" />
        {t(translations.common.loading)}
      </div>
    </div>
  );
}
