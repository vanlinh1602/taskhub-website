import {
  Check,
  CircleAlert,
  Copy,
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

const TOTAL_SETTINGS = 9;

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
  count,
  description,
  id,
  title,
  total,
}: {
  readonly children: React.ReactNode;
  readonly count: number;
  readonly description: string;
  readonly id: string;
  readonly title: string;
  readonly total: number;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--soft-shadow)]"
      id={id}
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-base font-bold" id={`${id}-title`}>
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${count === total ? 'bg-primary/10 text-link' : 'bg-muted text-muted-foreground'}`}
        >
          {count === total ? (
            <Check aria-hidden="true" className="size-3.5" />
          ) : null}
          {count}/{total}
        </span>
      </header>
      {children}
    </section>
  );
}

function StatusDot({ configured }: { readonly configured: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`size-2 shrink-0 rounded-full ${configured ? 'bg-link' : 'bg-muted-foreground/35'}`}
    />
  );
}

const rowClassName =
  'grid gap-3 border-t border-border/60 px-5 py-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] md:items-center md:gap-6';

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
    <form
      className="space-y-4 border-t border-border/60 px-5 py-4 sm:px-6"
      onSubmit={submit}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <label
          className="space-y-1.5 text-sm font-semibold"
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
          className="space-y-1.5 text-sm font-semibold"
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`text-xs ${isDirty ? 'font-semibold text-link' : 'text-muted-foreground'}`}
        >
          {isDirty ? t(translations.workspaceSettings.unsavedChanges) : null}
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
    <div className={rowClassName}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <StatusDot configured={Boolean(roleId)} />
          <p className="text-sm font-semibold">{roleLabel}</p>
        </div>
        <p className="mt-1 truncate pl-4 text-xs text-muted-foreground">
          {roleId
            ? `${selectedRole?.name ?? roleId} · ${t(translations.workspaceSettings.roleId)}: ${roleId}`
            : t(translations.workspaceSettings.notConfigured)}
        </p>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">
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
            className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={pending}
            onClick={() => onRemove(role)}
            size="icon"
            title={t(translations.workspaceSettings.remove)}
            type="button"
            variant="ghost"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        ) : null}
      </div>
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
    <div className={rowClassName}>
      <label
        className="flex items-center gap-2 text-sm font-semibold"
        htmlFor={`workspace-folder-${folder}`}
      >
        <StatusDot configured={Boolean(folderId)} />
        <span>{label}</span>
      </label>
      <div className="flex min-w-0 items-center gap-2">
        <Input
          className="min-w-0 flex-1 font-mono text-[13px]"
          id={`workspace-folder-${folder}`}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t(translations.workspaceSettings.folderId)}
          value={value}
        />
        <Button
          className="shrink-0"
          disabled={!value.trim() || !isDirty || pending}
          onClick={() => onSave(folder, value.trim())}
          type="button"
          variant={isDirty ? 'default' : 'outline'}
        >
          {t(translations.workspaceSettings.save)}
        </Button>
      </div>
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
    <div className={rowClassName}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <StatusDot configured={Boolean(channelId)} />
          <p className="text-sm font-semibold">{label}</p>
        </div>
        <p className="mt-1 truncate pl-4 text-xs text-muted-foreground">
          {channelId
            ? `${selectedChannel?.name ?? channelId} · ${t(translations.workspaceSettings.channelId)}: ${channelId}`
            : t(translations.workspaceSettings.notConfigured)}
        </p>
      </div>
      <div className="min-w-0">
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
  const progress = Math.round((configuredCount / TOTAL_SETTINGS) * 100);

  async function copyGuildId(): Promise<void> {
    try {
      await navigator.clipboard.writeText(workspaceId);
      toast.success(t(translations.workspaceSettings.saved));
    } catch {
      toast.error(t(translations.workspaceSettings.error));
    }
  }

  return (
    <header className="flex flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--soft-shadow)] sm:p-6 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
            {workspaceName}
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-link">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${isActive ? 'bg-link' : 'bg-muted-foreground'}`}
            />
            {isActive
              ? t(translations.workspaceSettings.activeWorkspace)
              : t(translations.workspaceSettings.notConfigured)}
          </span>
        </div>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{t(translations.workspaceSettings.discordGuildId)}</span>
          <code className="truncate rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
            {workspaceId}
          </code>
          <Button
            aria-label={t(translations.workspaceSettings.discordGuildId)}
            onClick={() => void copyGuildId()}
            size="icon-sm"
            title={t(translations.workspaceSettings.discordGuildId)}
            type="button"
            variant="ghost"
          >
            <Copy aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="w-full shrink-0 md:w-72">
        <div className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
          <span>{t(translations.workspaceSettings.configurationProgress)}</span>
          <span className="text-base font-bold text-foreground">
            {configuredCount}
            <span className="text-sm font-medium text-muted-foreground">
              /{TOTAL_SETTINGS}
            </span>
          </span>
        </div>
        <div
          aria-label={`${progress}%`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-link transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </header>
  );
}

function SectionNav({
  items,
}: {
  readonly items: readonly {
    readonly count: number;
    readonly href: string;
    readonly icon: React.ReactNode;
    readonly label: string;
    readonly total: number;
  }[];
}) {
  return (
    <nav
      aria-label="Settings sections"
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:sticky lg:top-24 lg:mx-0 lg:w-56 lg:shrink-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0 lg:pb-0"
    >
      {items.map((item) => (
        <a
          className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          href={item.href}
          key={item.href}
        >
          <span className="text-muted-foreground">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          <span
            className={`text-xs font-semibold ${item.count === item.total ? 'text-link' : 'text-muted-foreground'}`}
          >
            {item.count}/{item.total}
          </span>
        </a>
      ))}
    </nav>
  );
}

function LoadingSettings() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="flex flex-col gap-6 lg:flex-row">
        <Skeleton className="hidden h-48 w-56 rounded-2xl lg:block" />
        <div className="min-w-0 flex-1 space-y-5">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton className="h-52 w-full rounded-2xl" key={index} />
          ))}
        </div>
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
      data.roles.chapterNotification.discordRoleId,
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
    settings.roles.chapterNotification.discordRoleId,
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
      <section className="space-y-6">
        <ConfigurationSummary
          configuredCount={configuredCount}
          isActive={workspace.isActive}
          t={t}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <SectionNav
            items={[
              {
                count: workspaceDetailsCount,
                href: '#workspace-general',
                icon: <ShieldCheck aria-hidden="true" className="size-4" />,
                label: t(translations.workspaceSettings.title),
                total: 2,
              },
              {
                count: roleCount,
                href: '#workspace-roles',
                icon: <UsersRound aria-hidden="true" className="size-4" />,
                label: t(translations.workspaceSettings.roles),
                total: 3,
              },
              {
                count: folderCount,
                href: '#workspace-folders',
                icon: <FolderOpen aria-hidden="true" className="size-4" />,
                label: t(translations.workspaceSettings.folders),
                total: 2,
              },
              {
                count: channelCount,
                href: '#workspace-channels',
                icon: <MessageSquare aria-hidden="true" className="size-4" />,
                label: t(translations.workspaceSettings.channels),
                total: 4,
              },
            ]}
          />
          <div className="min-w-0 flex-1 space-y-5">
            <SettingGroup
              count={workspaceDetailsCount}
              description={t(translations.workspaceSettings.workspaceDescription)}
              id="workspace-general"
              title={t(translations.workspaceSettings.title)}
              total={2}
            >
              <WorkspaceDetailsSection
                currency={workspace.currency}
                t={t}
                timezone={workspace.timezone}
              />
            </SettingGroup>

            <SettingGroup
              count={roleCount}
              description={t(translations.workspaceSettings.rolesDescription)}
              id="workspace-roles"
              title={t(translations.workspaceSettings.roles)}
              total={3}
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
                <RoleSection
                  onRemove={setRoleToRemove}
                  onUpdate={updateRole}
                  pending={
                    updateRoleMutation.isPending || deleteRoleMutation.isPending
                  }
                  role="chapterNotification"
                  roleId={settings.roles.chapterNotification.discordRoleId}
                  roleLabel={t(
                    translations.workspaceSettings.chapterNotification,
                  )}
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
              count={folderCount}
              description={t(translations.workspaceSettings.foldersDescription)}
              id="workspace-folders"
              title={t(translations.workspaceSettings.folders)}
              total={2}
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
              count={channelCount}
              description={t(translations.workspaceSettings.channelsDescription)}
              id="workspace-channels"
              title={t(translations.workspaceSettings.channels)}
              total={4}
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
