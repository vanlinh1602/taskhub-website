import { ArrowRight, CircleMinus, Settings2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { translations } from '@/locales/translations';

export default function TaskActionButtons({
  isDeductDisabled,
  onDeduct,
  onEdit,
  viewChapterHref,
}: {
  readonly isDeductDisabled: boolean;
  readonly onDeduct: () => void;
  readonly onEdit: () => void;
  readonly viewChapterHref?: string;
}): ReactNode {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {viewChapterHref ? (
        <Button
          asChild
          aria-label={t(translations.management.stories.viewChapter)}
          className="text-primary hover:bg-primary/10 hover:text-primary"
          size="sm"
          variant="outline"
        >
          <Link to={viewChapterHref}>
            <ArrowRight aria-hidden="true" />
            {t(translations.management.stories.viewChapter)}
          </Link>
        </Button>
      ) : null}
      <Button
        aria-label={t(translations.management.stories.editTask)}
        className="text-primary hover:bg-primary/10 hover:text-primary"
        onClick={onEdit}
        size="sm"
        type="button"
        variant="outline"
      >
        <Settings2 aria-hidden="true" />
        {t(translations.management.stories.editTask)}
      </Button>
      <Button
        aria-label={t(translations.management.stories.deductMoney)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={isDeductDisabled}
        onClick={onDeduct}
        size="sm"
        type="button"
        variant="outline"
      >
        <CircleMinus aria-hidden="true" />
        {t(translations.management.stories.deductMoney)}
      </Button>
    </div>
  );
}
