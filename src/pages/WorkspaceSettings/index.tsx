import {
  Check,
  CircleAlert,
  Cloud,
  FolderOpen,
  MessageSquare,
  ShieldCheck,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import SelectSearch, {
  type Option as SelectSearchOption,
} from '@/components/ui/select-search';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import {
  useDeleteWorkspaceRoleMutation,
  useUpdateWorkspaceChannelMutation,
  useUpdateWorkspaceFolderMutation,
  useUpdateWorkspaceRoleMutation,
  useUpdateWorkspaceSettingsMutation,
  useWorkspaceDiscordOptionsQuery,
  useWorkspaceSettingsQuery,
} from '@/features/workspace-settings/hooks';
import type {
  WorkspaceChannelKey,
  WorkspaceFolderKey,
  WorkspaceRoleKey,
  WorkspaceSettingChannel,
} from '@/features/workspace-settings/types';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

interface WorkspaceFormValues {
  readonly timezone: string;
  readonly currency: string;
}

function isForbiddenError(error: unknown): boolean {
  const message = formatError(error).toLocaleLowerCase();
  return (
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('quyền') ||
    message.includes('server owner') ||
    message.includes('chủ server')
  );
}

function isUnavailableError(error: unknown): boolean {
  const message = formatError(error).toLocaleLowerCase();
  return (
    message.includes('connect') ||
    message.includes('discord') ||
    message.includes('network') ||
    message.includes('timeout')
  );
}

function SettingGroup({
  children,
  description,
  icon,
  title,
}: {
  readonly children: React.ReactNode;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly title: string;
}) {
  return (
    <section className="border-t border-border/70 pt-6 first:border-t-0 first:pt-0 sm:pt-8">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-6">
        <div className="flex items-center gap-2.5 text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase sm:items-start sm:pt-1">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
          <span>{title}</span>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="mt-5 sm:ml-[calc(11rem+1.5rem)]">{children}</div>
    </section>
  );
}

function ConfiguredBadge({
  configured,
  label,
}: {
  readonly configured: boolean;
  readonly label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${configured ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
    >
      {configured ? <Check aria-hidden="true" className="size-3.5" /> : null}
      {label}
    </span>
  );
}

function SettingsError({
  error,
  onRetry,
  t,
}: {
  readonly error: Error;
  readonly onRetry: () => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const forbidden = isForbiddenError(error);
  const unavailable = isUnavailableError(error);

  return (
    <Empty className="min-h-72 border border-destructive/20 bg-destructive/5">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlert />
        </EmptyMedia>
        <EmptyTitle>
          {forbidden
            ? t(translations.workspaceSettings.forbidden)
            : unavailable
              ? t(translations.workspaceSettings.botUnavailable)
              : t(translations.workspaceSettings.error)}
        </EmptyTitle>
        <EmptyDescription>
          {forbidden || unavailable
            ? t(translations.workspaceSettings.retry)
            : formatError(error)}
        </EmptyDescription>
      </EmptyHeader>
      <Button onClick={onRetry} variant="outline">
        {t(translations.workspaceSettings.retry)}
      </Button>
    </Empty>
  );
}

function WorkspaceDetailsSection({
  currency,
  timezone,
  t,
}: {
  readonly currency: string;
  readonly timezone: string;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const updateMutation = useUpdateWorkspaceSettingsMutation(workspaceId);
  const [values, setValues] = useState<WorkspaceFormValues>({
    currency,
    timezone,
  });

  useEffect(() => setValues({ currency, timezone }), [currency, timezone]);

  const isDirty = values.timezone !== timezone || values.currency !== currency;

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextTimezone = values.timezone.trim();
    const nextCurrency = values.currency.trim().toUpperCase();
    if (!nextTimezone || !nextCurrency || !/^[A-Z]{3}$/.test(nextCurrency)) {
      toast.error(t(translations.workspaceSettings.invalidCurrency));
      return;
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: nextTimezone }).format();
    } catch {
      toast.error(t(translations.workspaceSettings.invalidTimezone));
      return;
    }

    updateMutation.mutate(
      { currency: nextCurrency, timezone: nextTimezone },
      {
        onSuccess: () => toast.success(t(translations.workspaceSettings.saved)),
        onError: (error) => toast.error(formatError(error)),
      },
    );
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label
          className="space-y-2 text-sm font-medium"
          htmlFor="workspace-timezone"
        >
          <span>{t(translations.workspaceSettings.timezone)}</span>
          <Input
            id="workspace-timezone"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                timezone: event.target.value,
              }))
            }
            placeholder="Asia/Ho_Chi_Minh"
            value={values.timezone}
          />
        </label>
        <label
          className="space-y-2 text-sm font-medium"
          htmlFor="workspace-currency"
        >
          <span>{t(translations.workspaceSettings.currency)}</span>
          <Input
            id="workspace-currency"
            maxLength={3}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                currency: event.target.value.toUpperCase(),
              }))
            }
            value={values.currency}
          />
        </label>
      </div>
      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {isDirty
            ? t(translations.workspaceSettings.unsavedChanges)
            : t(translations.workspaceSettings.workspaceDescription)}
        </p>
        <Button disabled={!isDirty || updateMutation.isPending} type="submit">
          {t(translations.workspaceSettings.saveWorkspace)}
        </Button>
      </div>
    </form>
  );
}

function RoleSection({
  role,
  roleId,
  roleLabel,
  roleOptions,
  t,
  onRemove,
  onUpdate,
  pending,
}: {
  readonly role: WorkspaceRoleKey;
  readonly roleId: string | null;
  readonly roleLabel: string;
  readonly roleOptions: readonly {
    readonly id: string;
    readonly name: string;
  }[];
  readonly t: ReturnType<typeof useTranslation>['t'];
  readonly onRemove: (role: WorkspaceRoleKey) => void;
  readonly onUpdate: (role: WorkspaceRoleKey, roleId: string) => void;
  readonly pending: boolean;
}) {
  const selectedRole = roleOptions.find((option) => option.id === roleId);
  const selectOptions = useMemo<SelectSearchOption[]>(
    () =>
      roleOptions.map((option) => ({
        label: `${option.name} · ${option.id}`,
        value: option.id,
      })),
    [roleOptions],
  );
  const selectedOption = roleId
    ? (selectOptions.find((option) => option.value === roleId) ?? {
        label: `${selectedRole?.name ?? roleId} · ${roleId}`,
        value: roleId,
      })
    : null;

  return (
    <div className="grid gap-3 border-b border-border/60 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{roleLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedRole?.name ??
                roleId ??
                t(translations.workspaceSettings.notConfigured)}
              {roleId
                ? ` · ${t(translations.workspaceSettings.roleId)}: ${roleId}`
                : ''}
            </p>
          </div>
          <ConfiguredBadge
            configured={Boolean(roleId)}
            label={
              roleId
                ? t(translations.workspaceSettings.configured)
                : t(translations.workspaceSettings.notConfigured)
            }
          />
        </div>
        <SelectSearch
          disabled={pending || roleOptions.length === 0}
          noOptionsText={t(translations.workspaceSettings.noOptions)}
          onChange={(option) => {
            if (option) onUpdate(role, option.value);
          }}
          options={selectOptions}
          placeholder={t(translations.workspaceSettings.selectRole)}
          searchPlaceholder={t(translations.workspaceSettings.searchRole)}
          usePortal
          value={selectedOption}
        />
      </div>
      {roleId ? (
        <Button
          aria-label={`${t(translations.workspaceSettings.remove)} ${roleLabel}`}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={pending}
          onClick={() => onRemove(role)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" />
          <span className="hidden sm:inline">
            {t(translations.workspaceSettings.remove)}
          </span>
        </Button>
      ) : null}
    </div>
  );
}

function FolderSection({
  folder,
  folderId,
  label,
  t,
  onSave,
  pending,
}: {
  readonly folder: WorkspaceFolderKey;
  readonly folderId: string | null;
  readonly label: string;
  readonly t: ReturnType<typeof useTranslation>['t'];
  readonly onSave: (folder: WorkspaceFolderKey, folderId: string) => void;
  readonly pending: boolean;
}) {
  const [value, setValue] = useState(folderId ?? '');
  useEffect(() => setValue(folderId ?? ''), [folderId]);
  const isDirty = value.trim() !== (folderId ?? '');

  return (
    <div className="grid gap-3 border-b border-border/60 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <label
        className="space-y-2 text-sm font-medium"
        htmlFor={`workspace-folder-${folder}`}
      >
        <span>{label}</span>
        <Input
          id={`workspace-folder-${folder}`}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t(translations.workspaceSettings.folderId)}
          value={value}
        />
      </label>
      <Button
        disabled={!value.trim() || !isDirty || pending}
        onClick={() => onSave(folder, value.trim())}
        type="button"
      >
        <FolderOpen aria-hidden="true" />
        {t(translations.workspaceSettings.saveFolder)}
      </Button>
    </div>
  );
}

function ChannelSection({
  channel,
  channelId,
  label,
  options,
  t,
  onUpdate,
  pending,
}: {
  readonly channel: WorkspaceChannelKey;
  readonly channelId: string | null;
  readonly label: string;
  readonly options: readonly { readonly id: string; readonly name: string }[];
  readonly t: ReturnType<typeof useTranslation>['t'];
  readonly onUpdate: (channel: WorkspaceChannelKey, channelId: string) => void;
  readonly pending: boolean;
}) {
  const selectedChannel = options.find((option) => option.id === channelId);
  const selectOptions = useMemo<SelectSearchOption[]>(
    () =>
      options.map((option) => ({
        label: `${option.name} · ${option.id}`,
        value: option.id,
      })),
    [options],
  );
  const selectedOption = channelId
    ? (selectOptions.find((option) => option.value === channelId) ?? {
        label: `${selectedChannel?.name ?? channelId} · ${channelId}`,
        value: channelId,
      })
    : null;

  return (
    <div className="grid gap-3 border-b border-border/60 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedChannel?.name ??
                channelId ??
                t(translations.workspaceSettings.notConfigured)}
              {channelId
                ? ` · ${t(translations.workspaceSettings.channelId)}: ${channelId}`
                : ''}
            </p>
          </div>
          <ConfiguredBadge
            configured={Boolean(channelId)}
            label={
              channelId
                ? t(translations.workspaceSettings.configured)
                : t(translations.workspaceSettings.notConfigured)
            }
          />
        </div>
        <SelectSearch
          disabled={pending || options.length === 0}
          noOptionsText={t(translations.workspaceSettings.noOptions)}
          onChange={(option) => {
            if (option) onUpdate(channel, option.value);
          }}
          options={selectOptions}
          placeholder={t(translations.workspaceSettings.selectChannel)}
          searchPlaceholder={t(translations.workspaceSettings.searchChannel)}
          usePortal
          value={selectedOption}
        />
      </div>
    </div>
  );
}

function ConfigurationSummary({
  configuredCount,
  workspaceId,
  workspaceName,
  isActive,
  t,
}: {
  readonly configuredCount: number;
  readonly workspaceId: string;
  readonly workspaceName: string;
  readonly isActive: boolean;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const progress = Math.round((configuredCount / 8) * 100);

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-[var(--soft-shadow)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {t(translations.workspaceSettings.serverStatus)}
            </span>
            <ConfiguredBadge
              configured={configuredCount === 8}
              label={`${configuredCount}/8 ${t(translations.workspaceSettings.configured).toLocaleLowerCase()}`}
            />
          </div>
          <h2 className="mt-4 truncate text-3xl font-extrabold tracking-tight sm:text-4xl">
            {workspaceName}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t(translations.workspaceSettings.description)}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t(translations.workspaceSettings.discordGuildId)}
              </p>
              <p className="mt-1 truncate font-mono text-xs font-semibold">
                {workspaceId}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t(translations.workspaceSettings.nameReadOnly)}
              </p>
              <p className="mt-1 truncate text-sm font-semibold">
                {workspaceName}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-5 backdrop-blur-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
                {t(translations.workspaceSettings.configurationProgress)}
              </p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight">
                {configuredCount}
                <span className="text-lg font-semibold text-muted-foreground">
                  /8
                </span>
              </p>
            </div>
            <span className="text-sm font-semibold text-primary">{progress}%</span>
          </div>
          <div
            aria-label={`${progress}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {t(translations.workspaceSettings.configuredSummary, {
              count: configuredCount,
            })}
          </p>
          <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3 text-xs font-semibold">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${isActive ? 'bg-primary' : 'bg-muted-foreground'}`}
            />
            {isActive
              ? t(translations.workspaceSettings.activeWorkspace)
              : t(translations.workspaceSettings.notConfigured)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigurationMap({
  counts,
  t,
}: {
  readonly counts: readonly {
    readonly icon: React.ReactNode;
    readonly label: string;
    readonly value: string;
    readonly progress: number;
  }[];
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <aside className="self-start lg:sticky lg:top-24">
      <div className="rounded-[1.25rem] border border-border/70 bg-card/75 p-5 shadow-[var(--soft-shadow)]">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Cloud aria-hidden="true" className="size-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">
              {t(translations.workspaceSettings.configurationMap)}
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t(translations.workspaceSettings.configurationMapDescription)}
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-5">
          {counts.map((item) => (
            <div className="flex items-start gap-3" key={item.label}>
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{item.label}</p>
                  <span
                    className={`text-xs font-semibold ${item.progress > 0 ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {item.value}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${item.progress > 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function LoadingSettings() {
  return (
    <div className="space-y-10" aria-busy="true">
      <Skeleton className="h-52 w-full rounded-[1.75rem]" />
      <div className="grid gap-10 rounded-[1.75rem] border border-border/60 bg-card/45 p-5 shadow-[var(--soft-shadow)] sm:p-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
        <div className="space-y-10">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="space-y-5 border-t border-border/60 pt-7" key={index}>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ))}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  );
}

export default function WorkspaceSettingsPage() {
  const { t } = useTranslation();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const settingsQuery = useWorkspaceSettingsQuery(workspaceId);
  const optionsQuery = useWorkspaceDiscordOptionsQuery(workspaceId);
  const updateRoleMutation = useUpdateWorkspaceRoleMutation(workspaceId);
  const deleteRoleMutation = useDeleteWorkspaceRoleMutation(workspaceId);
  const updateFolderMutation = useUpdateWorkspaceFolderMutation(workspaceId);
  const updateChannelMutation = useUpdateWorkspaceChannelMutation(workspaceId);
  const [roleToRemove, setRoleToRemove] = useState<WorkspaceRoleKey | null>(
    null,
  );

  const configuredCount = useMemo(() => {
    const data = settingsQuery.data;
    if (!data) return 0;
    return [
      data.roles.manager.discordRoleId,
      data.roles.admin.discordRoleId,
      data.folders.storyWorkflow.googleDriveFolderId,
      data.folders.bankQr.googleDriveFolderId,
      data.channels.storyWorkflow.discordChannelId,
      data.channels.storyNotification.discordChannelId,
      data.channels.storyPublicationNotification.discordChannelId,
      data.channels.extensionRequest.discordChannelId,
    ].filter(Boolean).length;
  }, [settingsQuery.data]);

  function updateRole(role: WorkspaceRoleKey, roleId: string): void {
    updateRoleMutation.mutate(
      { role, discordRoleId: roleId },
      {
        onSuccess: () => toast.success(t(translations.workspaceSettings.saved)),
        onError: (error) => toast.error(formatError(error)),
      },
    );
  }

  function removeRole(): void {
    if (!roleToRemove) return;
    deleteRoleMutation.mutate(roleToRemove, {
      onSuccess: () => {
        setRoleToRemove(null);
        toast.success(t(translations.workspaceSettings.saved));
      },
      onError: (error) => toast.error(formatError(error)),
    });
  }

  function saveFolder(folder: WorkspaceFolderKey, folderId: string): void {
    updateFolderMutation.mutate(
      { type: folder, googleDriveFolderId: folderId },
      {
        onSuccess: () => toast.success(t(translations.workspaceSettings.saved)),
        onError: (error) => toast.error(formatError(error)),
      },
    );
  }

  function updateChannel(
    channel: WorkspaceChannelKey,
    channelId: string,
  ): void {
    updateChannelMutation.mutate(
      { type: channel, discordChannelId: channelId },
      {
        onSuccess: () => toast.success(t(translations.workspaceSettings.saved)),
        onError: (error) => toast.error(formatError(error)),
      },
    );
  }

  if (!workspaceId) {
    return (
      <Empty className="min-h-80 border bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldCheck />
          </EmptyMedia>
          <EmptyTitle>
            {t(translations.workspaceSettings.noWorkspace)}
          </EmptyTitle>
          <EmptyDescription>
            {t(translations.workspaceSettings.noWorkspaceDescription)}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (settingsQuery.isPending) return <LoadingSettings />;

  if (settingsQuery.isError) {
    return (
      <SettingsError
        error={settingsQuery.error}
        onRetry={() => void settingsQuery.refetch()}
        t={t}
      />
    );
  }

  const settings = settingsQuery.data;
  const discordOptions = optionsQuery.data;
  const roles = discordOptions?.roles ?? [];
  const forumChannels = discordOptions?.storyWorkflowChannels ?? [];
  const textChannels = discordOptions?.textChannels ?? [];
  const workspace = settings.workspace;

  function channelValue(channel: WorkspaceSettingChannel): string | null {
    return channel.discordChannelId;
  }

  const roleCount = [
    settings.roles.manager.discordRoleId,
    settings.roles.admin.discordRoleId,
  ].filter(Boolean).length;
  const folderCount = [
    settings.folders.storyWorkflow.googleDriveFolderId,
    settings.folders.bankQr.googleDriveFolderId,
  ].filter(Boolean).length;
  const channelCount = [
    settings.channels.storyWorkflow.discordChannelId,
    settings.channels.storyNotification.discordChannelId,
    settings.channels.storyPublicationNotification.discordChannelId,
    settings.channels.extensionRequest.discordChannelId,
  ].filter(Boolean).length;
  const workspaceDetailsCount = [workspace.timezone, workspace.currency].filter(
    Boolean,
  ).length;

  return (
    <>
      {/*
        THESIS: Turn workspace settings into a calm operational cockpit instead of four equal cards.
        OWN-WORLD: One mint status surface, open section rows, quiet borders, and compact progress context.
        STORY: Users see what is configured, scan the map, then complete the integrations in place.
        FIRST VIEWPORT: Workspace summary and progress lead; the first editable section begins below with a sticky map on desktop.
        FORM: Workspace cockpit, dealt surface candidate 5, seed 1bd38f53.
        FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
      */}
      <section className="space-y-10">
        <ConfigurationSummary
          configuredCount={configuredCount}
          isActive={workspace.isActive}
          t={t}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
        />

        <div className="grid gap-10 rounded-[1.75rem] border border-border/60 bg-card/45 p-5 shadow-[var(--soft-shadow)] sm:p-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
          <div className="min-w-0 space-y-10">
            <SettingGroup
              description={t(translations.workspaceSettings.workspaceDescription)}
              icon={<ShieldCheck aria-hidden="true" className="size-5" />}
              title={t(translations.workspaceSettings.title)}
            >
              <WorkspaceDetailsSection
                currency={workspace.currency}
                t={t}
                timezone={workspace.timezone}
              />
            </SettingGroup>

            <SettingGroup
              description={t(translations.workspaceSettings.rolesDescription)}
              icon={<UsersRound aria-hidden="true" className="size-5" />}
              title={t(translations.workspaceSettings.roles)}
            >
              <div>
                <RoleSection
                  onRemove={setRoleToRemove}
                  onUpdate={updateRole}
                  pending={
                    updateRoleMutation.isPending || deleteRoleMutation.isPending
                  }
                  role="manager"
                  roleId={settings.roles.manager.discordRoleId}
                  roleLabel={t(translations.workspaceSettings.manager)}
                  roleOptions={roles}
                  t={t}
                />
                <RoleSection
                  onRemove={setRoleToRemove}
                  onUpdate={updateRole}
                  pending={
                    updateRoleMutation.isPending || deleteRoleMutation.isPending
                  }
                  role="admin"
                  roleId={settings.roles.admin.discordRoleId}
                  roleLabel={t(translations.workspaceSettings.admin)}
                  roleOptions={roles}
                  t={t}
                />
                {optionsQuery.isError ? (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                    <span>
                      {isForbiddenError(optionsQuery.error)
                        ? t(translations.workspaceSettings.forbidden)
                        : t(translations.workspaceSettings.discordUnavailable)}
                    </span>
                  </div>
                ) : null}
              </div>
            </SettingGroup>

            <SettingGroup
              description={t(translations.workspaceSettings.foldersDescription)}
              icon={<FolderOpen aria-hidden="true" className="size-5" />}
              title={t(translations.workspaceSettings.folders)}
            >
              <div>
                <FolderSection
                  folder="storyWorkflow"
                  folderId={settings.folders.storyWorkflow.googleDriveFolderId}
                  label={t(translations.workspaceSettings.storyWorkflowFolder)}
                  onSave={saveFolder}
                  pending={updateFolderMutation.isPending}
                  t={t}
                />
                <FolderSection
                  folder="bankQr"
                  folderId={settings.folders.bankQr.googleDriveFolderId}
                  label={t(translations.workspaceSettings.bankQrFolder)}
                  onSave={saveFolder}
                  pending={updateFolderMutation.isPending}
                  t={t}
                />
              </div>
            </SettingGroup>

            <SettingGroup
              description={t(translations.workspaceSettings.channelsDescription)}
              icon={<MessageSquare aria-hidden="true" className="size-5" />}
              title={t(translations.workspaceSettings.channels)}
            >
              <div>
                <ChannelSection
                  channel="storyWorkflow"
                  channelId={channelValue(settings.channels.storyWorkflow)}
                  label={t(translations.workspaceSettings.channelStoryWorkflow)}
                  onUpdate={updateChannel}
                  options={forumChannels}
                  pending={updateChannelMutation.isPending}
                  t={t}
                />
                <ChannelSection
                  channel="storyNotification"
                  channelId={channelValue(settings.channels.storyNotification)}
                  label={t(translations.workspaceSettings.channelStoryNotification)}
                  onUpdate={updateChannel}
                  options={textChannels}
                  pending={updateChannelMutation.isPending}
                  t={t}
                />
                <ChannelSection
                  channel="storyPublicationNotification"
                  channelId={channelValue(
                    settings.channels.storyPublicationNotification,
                  )}
                  label={t(
                    translations.workspaceSettings
                      .channelStoryPublicationNotification,
                  )}
                  onUpdate={updateChannel}
                  options={textChannels}
                  pending={updateChannelMutation.isPending}
                  t={t}
                />
                <ChannelSection
                  channel="extensionRequest"
                  channelId={channelValue(settings.channels.extensionRequest)}
                  label={t(translations.workspaceSettings.channelExtensionRequest)}
                  onUpdate={updateChannel}
                  options={textChannels}
                  pending={updateChannelMutation.isPending}
                  t={t}
                />
              </div>
            </SettingGroup>
          </div>

          <ConfigurationMap
            counts={[
              {
                icon: <ShieldCheck aria-hidden="true" className="size-4" />,
                label: t(translations.workspaceSettings.title),
                progress: (workspaceDetailsCount / 2) * 100,
                value: `${workspaceDetailsCount}/2`,
              },
              {
                icon: <MessageSquare aria-hidden="true" className="size-4" />,
                label: t(translations.workspaceSettings.discordIntegration),
                progress: ((roleCount + channelCount) / 6) * 100,
                value: `${roleCount + channelCount}/6`,
              },
              {
                icon: <FolderOpen aria-hidden="true" className="size-4" />,
                label: t(translations.workspaceSettings.folders),
                progress: (folderCount / 2) * 100,
                value: `${folderCount}/2`,
              },
            ]}
            t={t}
          />
        </div>
      </section>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !deleteRoleMutation.isPending) setRoleToRemove(null);
        }}
        open={roleToRemove !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(translations.workspaceSettings.removeRole, {
                role: roleToRemove
                  ? t(translations.workspaceSettings[roleToRemove])
                  : '',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(translations.workspaceSettings.removeRoleDescription, {
                role: roleToRemove
                  ? t(translations.workspaceSettings[roleToRemove])
                  : '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRoleMutation.isPending}>
              {t(translations.workspaceSettings.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteRoleMutation.isPending}
              onClick={removeRole}
              variant="destructive"
            >
              {t(translations.workspaceSettings.remove)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
