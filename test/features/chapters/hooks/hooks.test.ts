import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import {
  createChapterQueryOptions,
  createChaptersQueryOptions,
  invalidateChapterConfigurationQueries,
  invalidateChapterTaskQueries,
} from '@/features/chapters/hooks';

describe('chapters hooks', () => {
  it('keeps workflow and page in the chapter list key', () => {
    expect(
      createChaptersQueryOptions('workspace-1', 'story-1', 'ACTIVE', 2),
    ).toMatchObject({
      enabled: true,
      queryKey: ['chapters', 'list', 'workspace-1', 'story-1', 'ACTIVE', 2],
      staleTime: 86400000,
    });
  });

  it('disables chapter details until all route identifiers exist', () => {
    expect(createChapterQueryOptions('workspace-1', 'story-1', '').enabled).toBe(
      false,
    );
    expect(
      createChapterQueryOptions('workspace-1', 'story-1', 'chapter-1').queryKey,
    ).toEqual([
      'chapters',
      'detail',
      'workspace-1',
      'story-1',
      'chapter-1',
    ]);
  });

  it('invalidates list, detail, and dashboard after configuration changes', async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true);

    await invalidateChapterConfigurationQueries(
      queryClient,
      'workspace-1',
      'story-1',
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chapters', 'list', 'workspace-1', 'story-1'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chapters', 'detail'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['admin', 'dashboard'],
    });
  });

  it('invalidates the exact detail, list, and dashboard after task changes', async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true);

    await invalidateChapterTaskQueries(
      queryClient,
      'workspace-1',
      'story-1',
      'chapter-1',
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [
        'chapters',
        'detail',
        'workspace-1',
        'story-1',
        'chapter-1',
      ],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chapters', 'list', 'workspace-1', 'story-1'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['admin', 'dashboard'],
    });
  });
});
