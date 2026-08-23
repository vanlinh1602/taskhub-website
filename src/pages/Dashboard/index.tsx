import { CheckCircle2, Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { translations } from '@/locales/translations';

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <section className="soft-surface overflow-hidden rounded-3xl">
      <div className="grid min-h-108 place-items-center px-6 py-12 text-center sm:px-10">
        <div className="max-w-md">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary shadow-[0_16px_36px_-20px_color-mix(in_oklch,var(--primary),transparent_35%)]">
            <Workflow aria-hidden="true" className="size-8" />
          </div>
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-bold text-primary">
            <CheckCircle2 aria-hidden="true" className="size-3.5" />
            {t(translations.dashboard.eyebrow)}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
            {t(translations.dashboard.title)}
          </h2>
          <p className="mt-3 text-sm leading-6 text-pretty text-muted-foreground sm:text-base">
            {t(translations.dashboard.description)}
          </p>
        </div>
      </div>
    </section>
  );
}
