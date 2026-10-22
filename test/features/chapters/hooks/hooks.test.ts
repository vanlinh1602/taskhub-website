import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import {
  createChapterQueryOptions,
  createChaptersQueryOptions,
  invalidateChapterConfigurationQueries,
  invalidateChapterDeleteQueries,
  invalidateChapterPublicationQueries,
  invalidateChapterRenameQueries,
  invalidateChapterTaskQueries,
} from '@/features/chapters/hooks';

describe('chapters hooks', () => {
  it('keys chapter list queries by workspace, story, and workflow only', () => {
    expect(
      createChaptersQueryOptions('workspace-1', 'story-1', 'ACTIVE'),
    ).toMatchObject({
      enabled: true,
      queryKey: ['chapters', 'list', 'workspace-1', 'story-1', 'ACTIVE'],
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

  it('invalidates derived chapter-name queries after a chapter rename', async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true);

    await invalidateChapterRenameQueries(
      queryClient,
      'workspace-1',
      'story-1',
    );

    for (const queryKey of [
      ['chapters', 'list', 'workspace-1', 'story-1'],
      ['chapters', 'detail'],
      ['admin', 'dashboard'],
      ['tasks', 'list'],
      ['statistics', 'list'],
      ['statistics', 'summary'],
      ['payroll', 'list'],
      ['payroll', 'detail'],
      ['payroll', 'batch-detail'],
    ]) {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey });
    }
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

  it('invalidates chapter list, detail, and dashboard after deletion', async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true);

    await invalidateChapterDeleteQueries(
      queryClient,
      'workspace-1',
      'story-1',
      'chapter-1',
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chapters', 'list', 'workspace-1', 'story-1'],
    });
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
      queryKey: ['chapters', 'detail'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['admin', 'dashboard'],
    });
  });

  it('invalidates statistics after a chapter publication changes', async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true);

    await invalidateChapterPublicationQueries(
      queryClient,
      'workspace-1',
      'story-1',
      'chapter-1',
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['statistics', 'list'],
    });
  });
});
