import type { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  readonly id: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly label: string;
}
