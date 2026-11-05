import { BellRing, MoreHorizontal, Trash2, Undo2 } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { translations } from '@/locales/translations';

export function ChapterActionsMenu({
  onDelete,
  onNotifyProgress,
  onUnpublish,
}: {
  readonly onDelete: () => void;
  readonly onNotifyProgress?: () => void;
  readonly onUnpublish?: () => void;
}): ReactNode {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t(translations.management.stories.actions)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {onNotifyProgress ? (
          <DropdownMenuItem onSelect={onNotifyProgress}>
            <BellRing aria-hidden="true" />
            {t(translations.management.stories.notifyProgress)}
          </DropdownMenuItem>
        ) : null}
        {onUnpublish ? (
          <DropdownMenuItem onSelect={onUnpublish}>
            <Undo2 aria-hidden="true" />
            {t(translations.management.stories.unpublish)}
          </DropdownMenuItem>
        ) : null}
        {onNotifyProgress || onUnpublish ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem
          className="text-destructive data-[highlighted]:text-destructive"
          onSelect={onDelete}
        >
          <Trash2 aria-hidden="true" />
          {t(translations.management.stories.deleteChapter)}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
