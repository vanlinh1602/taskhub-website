import { describe, expect, it } from 'vitest';

import { findNavigationItem, navigationItems } from '@/features/layouts/constants/navigation';
import { DEFAULT_PROTECTED_PATH, ROUTES } from '@/features/layouts/constants/routes';

describe('layout navigation', () => {
  it('registers Dashboard as the only available navigation item', () => {
    expect(navigationItems).toHaveLength(1);
    expect(navigationItems[0]).toMatchObject({
      href: ROUTES.DASHBOARD,
      id: 'dashboard',
    });
  });

  it('resolves the protected index route to Dashboard', () => {
    expect(DEFAULT_PROTECTED_PATH).toBe(ROUTES.DASHBOARD);
    expect(findNavigationItem(DEFAULT_PROTECTED_PATH)?.id).toBe('dashboard');
  });
});
