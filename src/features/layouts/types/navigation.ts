import type { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  readonly id: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly description?: string;
}

export interface NavigationSection {
  readonly id: string;
  readonly label: string;
  readonly items: readonly NavigationItem[];
}
