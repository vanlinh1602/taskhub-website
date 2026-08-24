import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { findNavigationItem } from '@/features/layouts/constants/navigation';
import { translations } from '@/locales/translations';

export default function ManagementPlaceholderPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigationItem = findNavigationItem(pathname);
  const pageTitle = navigationItem
    ? t(navigationItem.label)
    : t(translations.common.appName);
  const description = navigationItem?.description
    ? t(navigationItem.description)
    : t(translations.management.placeholder.description);

  return (
    <section className="flex min-h-96 flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {t(translations.management.eyebrow)}
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight">{pageTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <Empty className="min-h-80 border bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Construction aria-hidden="true" className="size-4" />
          </EmptyMedia>
          <EmptyTitle>
            {t(translations.management.placeholder.title)}
          </EmptyTitle>
          <EmptyDescription>
            {t(translations.management.placeholder.description)}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </section>
  );
}
