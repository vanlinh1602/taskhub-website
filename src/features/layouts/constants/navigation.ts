import { LayoutDashboard } from 'lucide-react';

import { translations } from '@/locales/translations';

import type { NavigationItem } from '../types';
import { ROUTES } from './routes';

export const navigationItems = [
  {
    id: 'dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    label: translations.navigation.dashboard,
  },
] as const satisfies readonly NavigationItem[];

export function findNavigationItem(
  pathname: string,
): NavigationItem | undefined {
  return navigationItems.find((item) => item.href === pathname);
}
