import { describe, expect, it } from 'vitest';

import { getNextTheme } from '@/features/layouts/utils/theme';

describe('getNextTheme', () => {
  it('switches from the resolved dark theme to light', () => {
    expect(getNextTheme('dark')).toBe('light');
  });

  it('switches from light or an unresolved theme to dark', () => {
    expect(getNextTheme('light')).toBe('dark');
    expect(getNextTheme(undefined)).toBe('dark');
  });
});
