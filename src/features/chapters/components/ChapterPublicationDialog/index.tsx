import { RefreshCw } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  Chapter,
  UpdateChapterPublicationInput,
} from '@/features/chapters/types';
import { translations } from '@/locales/translations';

export interface ChapterPublicationDialogProps {
  readonly chapter: Pick<
    Chapter,
    'chapterName' | 'id' | 'publicationStatus' | 'publicationUrl'
  > | null;
  readonly errorMessage?: string | null;
  readonly isPending: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (
    input: Pick<UpdateChapterPublicationInput, 'notify' | 'publicationUrl'>,
  ) => void;
}

export default function ChapterPublicationDialog({
  chapter,
  errorMessage,
  isPending,
  onOpenChange,
  onSubmit,
}: ChapterPublicationDialogProps) {
  const { t } = useTranslation();
  const [notify, setNotify] = useState(false);
  const [publicationUrl, setPublicationUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const chapterId = chapter?.id;

  useEffect(() => {
    if (!chapterId) return;
    setNotify(false);
    setPublicationUrl('');
    setValidationError(null);
  }, [chapterId]);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (notify) {
      const value = publicationUrl.trim();
      try {
        const url = new URL(value);
        if (!value || !['http:', 'https:'].includes(url.protocol))
          throw new Error('Invalid URL');
      } catch {
        setValidationError(
          t(translations.management.stories.publicationUrlRequired),
        );
        return;
      }
      onSubmit({ notify: true, publicationUrl: value });
      return;
    }
    setValidationError(null);
    onSubmit({ notify: false });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={chapter !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(translations.management.stories.publicationDialogTitle)}
          </DialogTitle>
          <DialogDescription>
            {chapter?.chapterName}
            <span aria-hidden="true"> · </span>
            {t(translations.management.stories.publicationDialogDescription)}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" noValidate onSubmit={submit}>
          <Label className="items-start" htmlFor="chapter-publication-notify">
            <Checkbox
              checked={notify}
              disabled={isPending}
              id="chapter-publication-notify"
              onCheckedChange={(checked) => {
                setNotify(checked === true);
                setValidationError(null);
              }}
            />
            <span>{t(translations.management.stories.publicationNotify)}</span>
          </Label>
          {notify ? (
            <div className="space-y-2">
              <Label htmlFor="chapter-publication-url">
                {t(translations.management.stories.publicationUrl)}
              </Label>
              <Input
                aria-describedby={
                  validationError ? 'chapter-publication-url-error' : undefined
                }
                aria-invalid={validationError ? true : undefined}
                disabled={isPending}
                id="chapter-publication-url"
                onChange={(event) => {
                  setPublicationUrl(event.target.value);
                  setValidationError(null);
                }}
                placeholder="https://..."
                required={notify}
                type="url"
                value={publicationUrl}
              />
              {validationError ? (
                <p
                  className="text-xs text-destructive"
                  id="chapter-publication-url-error"
                  role="alert"
                >
                  {validationError}
                </p>
              ) : null}
            </div>
          ) : null}
          {errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              {t(translations.management.stories.publicationDialogCancel)}
            </Button>
            <Button disabled={isPending || !chapter} type="submit">
              {isPending ? (
                <RefreshCw aria-hidden="true" className="animate-spin" />
              ) : null}
              {isPending
                ? t(translations.management.stories.loading)
                : t(translations.management.stories.publish)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
