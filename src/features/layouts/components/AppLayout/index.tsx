import { Check, Fingerprint, Languages, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router';
import { useShallow } from 'zustand/shallow';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useWorkspacesQuery } from '@/features/admin/hooks';
import { useUserStore } from '@/features/user/hooks';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';

import { findNavigationItem } from '../../constants/navigation';
import { getNextTheme } from '../../utils/theme';
import AppSidebar from '../AppSidebar';

export default function AppLayout() {
  const { i18n, t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const { pathname } = useLocation();
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const workspacesQuery = useWorkspacesQuery();
  const { logout, user } = useUserStore(
    useShallow((state) => ({
      logout: state.logout,
      user: state.user,
    })),
  );
  const isDarkTheme = resolvedTheme === 'dark';
  const currentLanguage = i18n.resolvedLanguage?.startsWith('en')
    ? 'en'
    : 'vi';
  const pageTitle = useMemo(() => {
    const navigationItem = findNavigationItem(pathname);

    return navigationItem
      ? t(navigationItem.label)
      : t(translations.common.appName);
  }, [pathname, t]);
  const activeWorkspace =
    workspacesQuery.data?.find(
      (workspace) => workspace.id === activeWorkspaceId,
    ) ?? workspacesQuery.data?.[0];

  useEffect(() => {
    if (!activeWorkspaceId && activeWorkspace)
      setActiveWorkspace(activeWorkspace);
  }, [activeWorkspace, activeWorkspaceId, setActiveWorkspace]);

  function handleThemeToggle(): void {
    setTheme(getNextTheme(resolvedTheme));
  }

  async function handleLogout(): Promise<void> {
    await logout();
  }

  async function handleLanguageChange(language: 'en' | 'vi'): Promise<void> {
    if (currentLanguage === language) return;

    await i18n.changeLanguage(language);
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="app-canvas min-h-svh bg-transparent md:my-3 md:mr-3 md:rounded-3xl md:border md:border-border/70">
          <header className="sticky top-0 z-40 shrink-0 border-b border-border/60 bg-background/72 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center gap-3">
              <SidebarTrigger
                aria-label={t(translations.layouts.toggleSidebar)}
                className="rounded-xl"
              />
              <div className="min-w-0">
                <p className="hidden text-xs font-medium text-muted-foreground sm:block">
                  {activeWorkspace?.name ??
                    t(translations.layouts.workspaceFallback)}
                </p>
                <h1 className="truncate text-base font-extrabold tracking-tight sm:text-lg">
                  {pageTitle}
                </h1>
              </div>
              <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                <Select
                  value={activeWorkspace?.id}
                  onValueChange={(workspaceId) =>
                    setActiveWorkspace(
                      workspacesQuery.data?.find(
                        (workspace) => workspace.id === workspaceId,
                      ),
                    )
                  }
                >
                  <SelectTrigger
                    aria-label={t(translations.layouts.workspaceFallback)}
                    className="hidden max-w-52 bg-card shadow-sm md:flex"
                  >
                    <SelectValue
                      placeholder={t(translations.layouts.workspaceFallback)}
                    />
                  </SelectTrigger>
                  <SelectContent align="end" position="popper">
                    <SelectGroup>
                      <SelectLabel>
                        {t(translations.layouts.workspaceFallback)}
                      </SelectLabel>
                      {workspacesQuery.data?.map((workspace) => (
                        <SelectItem key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  aria-label={t(
                    isDarkTheme
                      ? translations.layouts.switchToLight
                      : translations.layouts.switchToDark,
                  )}
                  className="rounded-xl"
                  onClick={handleThemeToggle}
                  size="icon"
                  title={t(
                    isDarkTheme
                      ? translations.layouts.switchToLight
                      : translations.layouts.switchToDark,
                  )}
                  type="button"
                  variant="ghost"
                >
                  {isDarkTheme ? (
                    <Sun aria-hidden="true" />
                  ) : (
                    <Moon aria-hidden="true" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-label={t(translations.layouts.openAccountMenu)}
                      className="size-9 rounded-full p-0 ring-offset-background hover:ring-2 hover:ring-primary/25"
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <img
                        alt=""
                        className="size-8 rounded-full border border-border/70 object-cover"
                        src={
                          user?.avatar || '/assets/brand/taskory-hub-logo.png'
                        }
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    aria-label={t(translations.layouts.accountMenu)}
                    className="w-80 p-2"
                  >
                    <DropdownMenuLabel className="p-2">
                      <div className="flex items-center gap-3">
                        <img
                          alt=""
                          className="size-12 shrink-0 rounded-2xl border border-border/70 object-cover shadow-sm"
                          src={
                            user?.avatar ||
                            '/assets/brand/taskory-hub-logo.png'
                          }
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold tracking-tight">
                            {user?.name ?? t(translations.layouts.account)}
                          </p>
                          <p className="truncate text-xs font-normal text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl border border-border/70 bg-muted/50 px-3 py-2.5">
                        <div className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
                          <Fingerprint aria-hidden="true" className="size-3.5" />
                          {t(translations.layouts.discord)}
                        </div>
                        <p className="mt-1 truncate font-mono text-xs font-semibold text-foreground">
                          {user?.discordUserId ?? '—'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-muted-foreground">
                      <Languages aria-hidden="true" className="size-3.5" />
                      {t(translations.layouts.language)}
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      className="justify-between py-2.5"
                      onSelect={() => void handleLanguageChange('en')}
                    >
                      <span>{t(translations.layouts.english)}</span>
                      {currentLanguage === 'en' ? (
                        <Check aria-hidden="true" className="size-4 text-primary" />
                      ) : null}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="justify-between py-2.5"
                      onSelect={() => void handleLanguageChange('vi')}
                    >
                      <span>{t(translations.layouts.vietnamese)}</span>
                      {currentLanguage === 'vi' ? (
                        <Check aria-hidden="true" className="size-4 text-primary" />
                      ) : null}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="justify-center py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onSelect={() => void handleLogout()}
                    >
                      <LogOut aria-hidden="true" />
                      {t(translations.auth.logout)}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <main className="flex flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
