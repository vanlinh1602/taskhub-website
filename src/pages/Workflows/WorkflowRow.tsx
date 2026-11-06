import { ArrowRight, Check, MoreHorizontal } from 'lucide-react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WorkflowTemplateSummary } from '@/features/workflows/types';
import { translations } from '@/locales/translations';

import WorkflowStatusBadge from './WorkflowStatusBadge';

export type WorkflowActionKind =
  | 'publish'
  | 'deactivate'
  | 'restore'
  | 'delete';

interface WorkflowRowProps {
  readonly isPending: boolean;
  readonly locale: string;
  readonly onAction: (
    kind: WorkflowActionKind,
    workflow: WorkflowTemplateSummary,
  ) => void;
  readonly onDefault: (workflow: WorkflowTemplateSummary) => void;
  readonly workflow: WorkflowTemplateSummary;
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export default function WorkflowRow({
  isPending,
  locale,
  onAction,
  onDefault,
  workflow,
}: WorkflowRowProps) {
  const { t } = useTranslation();
  const steps = workflow.steps ?? [];
  const editPath = `/workflows/${workflow.id}`;
  const hasMenu = workflow.status !== 'INACTIVE';

  return (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border/70 p-4 first:border-t-0 sm:px-5">
      <div className="grid min-w-0 flex-[999_1_26rem] gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="rounded-md text-base leading-tight font-bold outline-none hover:text-link focus-visible:ring-3 focus-visible:ring-ring/50"
            to={editPath}
          >
            {workflow.name}
          </Link>
          <WorkflowStatusBadge status={workflow.status} />
          {workflow.isDefault ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-positive-surface px-2 py-0.5 text-xs font-semibold text-positive">
              <Check aria-hidden="true" className="size-3" />
              {t(translations.workflows.defaultShort)}
            </span>
          ) : null}
        </div>
        {steps.length > 0 ? (
          <ol
            aria-label={t(translations.workflows.steps)}
            className="flex flex-wrap items-center gap-x-1.5 gap-y-1"
          >
            {steps.map((step, index) => (
              <Fragment key={step.join('|')}>
                {index > 0 ? (
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3.5 text-muted-foreground"
                  />
                ) : null}
                <li className="rounded-lg bg-muted px-2 py-px text-[0.8125rem] whitespace-nowrap">
                  {step.join(' + ')}
                </li>
              </Fragment>
            ))}
          </ol>
        ) : null}
        {workflow.stageCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t(translations.workflows.noStagesYet)}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          <span className="font-mono">#{workflow.id}</span> ·{' '}
          {t(translations.workflows.version, {
            version: workflow.configurationVersion,
          })}{' '}
          ·{' '}
          {t(translations.workflows.stageTotal, {
            count: workflow.stageCount,
          })}{' '}
          ·{' '}
          {t(translations.workflows.updatedOn, {
            date: formatDate(workflow.updatedAt, locale),
          })}
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1.5">
        {workflow.status === 'DRAFT' ? (
          <Button
            disabled={isPending || workflow.stageCount === 0}
            onClick={() => onAction('publish', workflow)}
            size="sm"
            type="button"
            variant="outline"
          >
            {t(translations.workflows.publish)}
          </Button>
        ) : null}
        {workflow.status === 'INACTIVE' ? (
          <Button
            disabled={isPending}
            onClick={() => onAction('restore', workflow)}
            size="sm"
            type="button"
            variant="outline"
          >
            {t(translations.workflows.restore)}
          </Button>
        ) : null}
        <Button asChild size="sm" variant="outline">
          <Link
            aria-label={`${t(translations.workflows.edit)}: ${workflow.name}`}
            to={editPath}
          >
            {t(translations.workflows.edit)}
          </Link>
        </Button>
        {hasMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`${t(translations.workflows.actions)}: ${workflow.name}`}
                disabled={isPending}
                size="icon"
                type="button"
                variant="ghost"
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {workflow.status === 'ACTIVE' ? (
                <DropdownMenuItem onSelect={() => onDefault(workflow)}>
                  {workflow.isDefault
                    ? t(translations.workflows.clearDefault)
                    : t(translations.workflows.setDefault)}
                </DropdownMenuItem>
              ) : null}
              {workflow.status === 'ACTIVE' ? (
                <DropdownMenuItem
                  onSelect={() => onAction('deactivate', workflow)}
                >
                  {t(translations.workflows.deactivate)}
                </DropdownMenuItem>
              ) : null}
              {workflow.status === 'DRAFT' ? (
                <DropdownMenuItem
                  className="text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
                  onSelect={() => onAction('delete', workflow)}
                >
                  {t(translations.workflows.delete)}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </li>
  );
}
