import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
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
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useUserStore } from '@/features/user/hooks';
import { translations } from '@/locales/translations';

import { findNavigationItem } from '../../constants/navigation';
import { getNextTheme } from '../../utils/theme';
import { getWorkspaceName } from '../../utils/workspace';
import AppSidebar from '../AppSidebar';

export default function AppLayout() {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const { pathname } = useLocation();
  const { logout, user } = useUserStore(
    useShallow((state) => ({
      logout: state.logout,
      user: state.user,
    })),
  );
  const isDarkTheme = resolvedTheme === 'dark';
  const pageTitle = useMemo(() => {
    const navigationItem = findNavigationItem(pathname);

    return navigationItem
      ? t(navigationItem.label)
      : t(translations.common.appName);
  }, [pathname, t]);
  const workspaceName = useMemo(
    () => getWorkspaceName(user, t(translations.layouts.workspaceFallback)),
    [t, user],
  );

  function handleThemeToggle(): void {
    setTheme(getNextTheme(resolvedTheme));
  }

  async function handleLogout(): Promise<void> {
    await logout();
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="app-canvas min-h-svh bg-transparent md:my-3 md:mr-3 md:rounded-3xl md:border md:border-border/70">
          <header className="sticky top-0 z-20 shrink-0 border-b border-border/60 bg-background/72 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center gap-3">
              <SidebarTrigger
                aria-label={t(translations.layouts.toggleSidebar)}
                className="rounded-xl"
              />
              <div className="min-w-0">
                <p className="hidden text-xs font-medium text-muted-foreground sm:block">
                  {workspaceName}
                </p>
                <h1 className="truncate text-base font-extrabold tracking-tight sm:text-lg">
                  {pageTitle}
                </h1>
              </div>
              <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                <div className="hidden items-center gap-2 rounded-xl border border-border/70 bg-card/75 px-3 py-1.5 text-xs font-semibold shadow-sm md:flex">
                  <span className="size-2 rounded-full bg-primary shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary),transparent_85%)]" />
                  <span className="max-w-44 truncate">{workspaceName}</span>
                </div>
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
                  >
                    <DropdownMenuLabel>
                      <p className="truncate text-sm font-bold">
                        {user?.name ?? t(translations.layouts.account)}
                      </p>
                      <p className="truncate pt-0.5 text-xs font-normal text-muted-foreground">
                        {user?.email}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
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
