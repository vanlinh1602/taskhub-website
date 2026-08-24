import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { translations } from '@/locales/translations';

import {
  isNavigationItemActive,
  navigationSections,
} from '../../constants/navigation';

export default function AppSidebar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" variant="floating" className="md:py-3 md:pl-3">
      <SidebarHeader className="px-3 py-3 group-data-[collapsible=icon]:px-1.5">
        <div className="flex items-center gap-3 overflow-hidden rounded-xl px-1 py-1 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0">
          <img
            className="size-9 shrink-0 rounded-xl shadow-control"
            src="/assets/brand/taskory-hub-logo.png"
            alt=""
          />
          <span className="truncate text-sm font-extrabold tracking-tight group-data-[collapsible=icon]:hidden">
            {t(translations.common.appName)}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-1.5">
        {navigationSections.map((section) => (
          <SidebarGroup
            key={section.id}
            className="p-1 group-data-[collapsible=icon]:p-0"
          >
            <SidebarGroupLabel className="px-3 text-[0.65rem] font-bold tracking-[0.12em] text-sidebar-foreground/50 uppercase">
              {t(section.label)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      className="h-10 rounded-xl px-3 font-semibold group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-2.5! data-active:shadow-sm"
                      isActive={isNavigationItemActive(item, pathname)}
                      tooltip={t(item.label)}
                    >
                      <NavLink to={item.href} end>
                        <item.icon aria-hidden="true" />
                        <span>{t(item.label)}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:hidden">
        <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/45 px-3 py-2 text-xs font-medium text-sidebar-foreground/65 group-data-[collapsible=icon]:hidden">
          {t(translations.layouts.sidebarHint)}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
