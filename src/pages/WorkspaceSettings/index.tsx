import {
  Check,
  ChevronDown,
  CircleAlert,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

function SectionCard({
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
    <Card className="overflow-hidden border-border/70 shadow-[var(--soft-shadow)]">
      <CardHeader className="border-b border-border/60 bg-muted/20">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1 leading-5">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">{children}</CardContent>
    </Card>
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
    <form className="grid gap-5 lg:grid-cols-[1fr_auto]" onSubmit={submit}>
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
      <div className="flex items-end justify-end">
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
  return (
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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
        <Select
          disabled={pending || roleOptions.length === 0}
          onValueChange={(value) => onUpdate(role, value)}
          value={roleId ?? undefined}
        >
          <SelectTrigger className="w-full" id={`workspace-role-${role}`}>
            <SelectValue
              placeholder={t(translations.workspaceSettings.selectRole)}
            />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.length === 0 ? (
              <SelectItem disabled value="__empty">
                {t(translations.workspaceSettings.noOptions)}
              </SelectItem>
            ) : (
              roleOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <span className="flex flex-col">
                    <span>{option.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {option.id}
                    </span>
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      {roleId ? (
        <Button
          aria-label={`${t(translations.workspaceSettings.remove)} ${roleLabel}`}
          disabled={pending}
          onClick={() => onRemove(role)}
          size="sm"
          type="button"
          variant="destructive"
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
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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
  return (
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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
        <Select
          disabled={pending || options.length === 0}
          onValueChange={(value) => onUpdate(channel, value)}
          value={channelId ?? undefined}
        >
          <SelectTrigger className="w-full" id={`workspace-channel-${channel}`}>
            <SelectValue
              placeholder={t(translations.workspaceSettings.selectChannel)}
            />
          </SelectTrigger>
          <SelectContent>
            {options.length === 0 ? (
              <SelectItem disabled value="__empty">
                {t(translations.workspaceSettings.noOptions)}
              </SelectItem>
            ) : (
              options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <span className="flex flex-col">
                    <span>{option.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {option.id}
                    </span>
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <ChevronDown aria-hidden="true" className="size-3.5" />
        {t(translations.workspaceSettings.saveChannel)}
      </div>
    </div>
  );
}

function LoadingSettings() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-28 w-full rounded-3xl" />
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-64 rounded-2xl" key={index} />
        ))}
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

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--soft-shadow)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {t(translations.workspaceSettings.serverStatus)}
              </span>
              <ConfiguredBadge
                configured={configuredCount > 0}
                label={`${configuredCount}/7 ${t(translations.workspaceSettings.configured).toLocaleLowerCase()}`}
              />
            </div>
            <h2 className="mt-3 truncate text-3xl font-extrabold tracking-tight sm:text-4xl">
              {workspace.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(translations.workspaceSettings.description)}
            </p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:min-w-80">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t(translations.workspaceSettings.discordGuildId)}
              </p>
              <p className="mt-1 truncate font-mono text-xs font-semibold">
                {workspace.id}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t(translations.workspaceSettings.nameReadOnly)}
              </p>
              <p className="mt-1 truncate text-sm font-semibold">
                {workspace.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          description={t(translations.workspaceSettings.workspaceDescription)}
          icon={<ShieldCheck aria-hidden="true" className="size-5" />}
          title={t(translations.workspaceSettings.title)}
        >
          <WorkspaceDetailsSection
            currency={workspace.currency}
            t={t}
            timezone={workspace.timezone}
          />
        </SectionCard>

        <SectionCard
          description={t(translations.workspaceSettings.rolesDescription)}
          icon={<UsersRound aria-hidden="true" className="size-5" />}
          title={t(translations.workspaceSettings.roles)}
        >
          <div className="space-y-3">
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
              <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
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
        </SectionCard>

        <SectionCard
          description={t(translations.workspaceSettings.foldersDescription)}
          icon={<FolderOpen aria-hidden="true" className="size-5" />}
          title={t(translations.workspaceSettings.folders)}
        >
          <div className="space-y-3">
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
        </SectionCard>

        <SectionCard
          description={t(translations.workspaceSettings.channelsDescription)}
          icon={<MessageSquare aria-hidden="true" className="size-5" />}
          title={t(translations.workspaceSettings.channels)}
        >
          <div className="space-y-3">
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
              channel="extensionRequest"
              channelId={channelValue(settings.channels.extensionRequest)}
              label={t(translations.workspaceSettings.channelExtensionRequest)}
              onUpdate={updateChannel}
              options={textChannels}
              pending={updateChannelMutation.isPending}
              t={t}
            />
          </div>
        </SectionCard>
      </div>

      <p className="text-xs text-muted-foreground">
        {workspace.isActive
          ? t(translations.workspaceSettings.configured)
          : t(translations.workspaceSettings.notConfigured)}
      </p>

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
    </section>
  );
}
