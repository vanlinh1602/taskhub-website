import { describe, expect, it } from 'vitest';

import {
  createDashboardQueryOptions,
  createWorkspacesQueryOptions,
} from '@/features/admin/hooks';

describe('admin query options', () => {
  it('uses the stable workspace list key', () => {
    expect(createWorkspacesQueryOptions().queryKey).toEqual([
      'workspace',
      'list',
    ]);
  });

  it('disables dashboard loading without a workspace', () => {
    expect(createDashboardQueryOptions('').enabled).toBe(false);
    expect(createDashboardQueryOptions('workspace-1')).toMatchObject({
      enabled: true,
      queryKey: ['admin', 'dashboard', 'workspace-1'],
    });
  });
});
