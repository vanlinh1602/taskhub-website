import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import {
  createDeadlineExtensionsQueryOptions,
  invalidateDeadlineExtensionQueries,
} from '@/features/deadline-extensions/hooks';

describe('deadline extension hooks', () => {
  it('keeps status, search, and pagination in the query key', () => {
    const options = createDeadlineExtensionsQueryOptions('workspace-1', {
      page: 2,
      pageSize: 25,
      search: 'chapter 2',
      status: 'REJECTED',
    });

    expect(options).toMatchObject({
      enabled: true,
      queryKey: [
        'deadline-extensions',
        'list',
        'workspace-1',
        {
          page: 2,
          pageSize: 25,
          search: 'chapter 2',
          status: 'REJECTED',
        },
      ],
      staleTime: 30000,
    });
  });

  it('disables the list query without a workspace', () => {
    expect(
      createDeadlineExtensionsQueryOptions('', {
        page: 0,
        pageSize: 25,
        search: '',
        status: 'PENDING',
      }).enabled,
    ).toBe(false);
  });

  it('invalidates extensions and deadline consumers after a decision', async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true);

    await invalidateDeadlineExtensionQueries(queryClient);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['deadline-extensions', 'list'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['admin', 'dashboard'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['tasks', 'list'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chapters', 'detail'],
    });
  });
});
