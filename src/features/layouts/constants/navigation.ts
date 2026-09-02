import {
  BookOpen,
  CalendarClock,
  ChartNoAxesCombined,
  CircleDollarSign,
  LayoutDashboard,
  ListTodo,
  Settings2,
  ShieldCheck,
  Users,
  Waypoints,
} from 'lucide-react';

import { translations } from '@/locales/translations';

import type { NavigationItem, NavigationSection } from '../types';
import { ROUTES } from './routes';

export const navigationSections = [
  {
    id: 'overview',
    label: translations.navigation.overview,
    items: [
      {
        id: 'dashboard',
        href: ROUTES.DASHBOARD,
        icon: LayoutDashboard,
        label: translations.navigation.dashboard,
      },
    ],
  },
  {
    id: 'operations',
    label: translations.navigation.operations,
    items: [
      {
        id: 'stories',
        href: ROUTES.STORIES,
        icon: BookOpen,
        label: translations.navigation.stories,
        description: translations.management.stories.description,
      },
      {
        id: 'tasks',
        href: ROUTES.TASKS,
        icon: ListTodo,
        label: translations.navigation.tasks,
        description: translations.management.tasks.description,
      },
      {
        id: 'deadlineExtensions',
        href: ROUTES.DEADLINE_EXTENSIONS,
        icon: CalendarClock,
        label: translations.navigation.deadlineExtensions,
        description: translations.management.deadlineExtensions.description,
      },
      {
        id: 'payroll',
        href: ROUTES.PAYROLL,
        icon: CircleDollarSign,
        label: translations.navigation.payroll,
        description: translations.management.payroll.description,
      },
      {
        id: 'statistics',
        href: ROUTES.STATISTICS,
        icon: ChartNoAxesCombined,
        label: translations.navigation.statistics,
        description: translations.statistics.description,
      },
    ],
  },
  {
    id: 'configuration',
    label: translations.navigation.configuration,
    items: [
      {
        id: 'workflows',
        href: ROUTES.WORKFLOWS,
        icon: Waypoints,
        label: translations.navigation.workflows,
        description: translations.management.workflows.description,
      },
      {
        id: 'stages',
        href: ROUTES.STAGES,
        icon: Settings2,
        label: translations.navigation.stages,
        description: translations.management.stages.description,
      },
      {
        id: 'members',
        href: ROUTES.MEMBERS,
        icon: Users,
        label: translations.navigation.members,
        description: translations.management.members.description,
      },
      {
        id: 'workspaceSettings',
        href: ROUTES.WORKSPACE_SETTINGS,
        icon: ShieldCheck,
        label: translations.navigation.workspaceSettings,
        description: translations.management.workspaceSettings.description,
      },
    ],
  },
] as const satisfies readonly NavigationSection[];

export const navigationItems: readonly NavigationItem[] =
  navigationSections.flatMap(
    (section): readonly NavigationItem[] => section.items,
  );

export function findNavigationItem(
  pathname: string,
): NavigationItem | undefined {
  return navigationItems.find((item) => isNavigationItemActive(item, pathname));
}

export function isNavigationItemActive(
  item: NavigationItem,
  pathname: string,
): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
