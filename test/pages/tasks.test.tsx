import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createTaskFilterOptionsQueryOptions,
  createTasksQueryOptions,
} from '@/features/tasks/hooks';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import i18n from '@/locales/i18n';
import TasksPage from '@/pages/Tasks';

vi.mock('@/features/workspace/hooks', () => ({
  useWorkspaceStore: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(useWorkspaceStore).mockReturnValue({
    activeWorkspaceId: 'workspace-1',
  } as never);
});

describe('TasksPage', () => {
  it('renders labeled edit and deduction actions for task rows', async () => {
    await i18n.changeLanguage('vi');
    const workspaceId = 'workspace-1';
    const queryClient = new QueryClient();
    const query = {
      page: 0,
      pageSize: 25,
      sortBy: 'DEADLINE' as const,
      sortOrder: 'ASC' as const,
    };
    queryClient.setQueryData(createTasksQueryOptions(workspaceId, query).queryKey, {
      items: [
        {
          agreedPrice: '20',
          assigneeDiscordUserId: null,
          assigneeDisplayName: null,
          chapterId: 'chapter-1',
          chapterName: 'Chapter 1',
          currency: 'VND',
          dueAt: null,
          id: 'task-1',
          paymentStatus: 'NOT_READY',
          stageCode: 'TRANSLATE',
          stageDefinitionId: 'stage-1',
          stageName: 'Translate',
          status: 'READY',
          storyId: 'story-1',
          storyTitle: 'Story',
        },
      ],
      page: 0,
      pageCount: 1,
      total: 1,
    });
    queryClient.setQueryData(
      createTaskFilterOptionsQueryOptions(workspaceId).queryKey,
      { stages: [], stories: [] },
    );

    const markup = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TasksPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(markup).toContain('Chỉnh sửa task');
    expect(markup).toContain('Trừ tiền');
    expect(markup).toContain('Tất cả trạng thái');
    expect(markup).toContain('Sắp xếp theo');
  });
});
