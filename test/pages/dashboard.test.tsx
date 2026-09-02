import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDashboardQuery } from '@/features/admin/hooks';
import type { AdminDashboard } from '@/features/admin/types';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import i18n from '@/locales/i18n';
import DashboardPage from '@/pages/Dashboard';

vi.mock('@/features/admin/hooks', () => ({
  useDashboardQuery: vi.fn(),
}));

vi.mock('@/features/workspace/hooks', () => ({
  useWorkspaceStore: vi.fn(),
}));

const dashboard = {
  attention: {
    blockedTasks: 2,
    overdueTasks: 1,
    pendingExtensions: 1,
    pendingPayments: 1,
    readyToPublish: 1,
  },
  actionItems: [
    {
      id: 'task-1',
      type: 'OVERDUE_TASK',
      storyId: 'story-1',
      storyTitle: 'Story 1',
      chapterId: 'chapter-1',
      chapterName: 'Chapter 1',
      stageName: 'Translation',
      dueAt: '2026-08-30T00:00:00.000Z',
      createdAt: '2026-08-29T00:00:00.000Z',
      requestedHours: null,
    },
    {
      id: 'extension-1',
      type: 'PENDING_EXTENSION',
      storyId: 'story-1',
      storyTitle: 'Story 1',
      chapterId: 'chapter-2',
      chapterName: 'Chapter 2',
      stageName: 'Review',
      dueAt: null,
      createdAt: '2026-08-29T00:00:00.000Z',
      requestedHours: 4,
    },
  ],
  progress: [{ date: '2026-08-30', completed: 3 }],
  stages: [{ name: 'Translation', total: 5, completed: 3 }],
} satisfies AdminDashboard;

beforeEach(() => {
  vi.mocked(useWorkspaceStore).mockReturnValue({
    activeWorkspaceId: '',
  } as never);
  vi.mocked(useDashboardQuery).mockReturnValue({
    data: undefined,
    isError: false,
    isFetching: false,
    isLoading: false,
    refetch: vi.fn(),
  } as never);
});

describe('DashboardPage', () => {
  it('renders the dashboard heading without an active workspace', async () => {
    await i18n.changeLanguage('vi');
    const queryClient = new QueryClient();
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    expect(markup).toContain('Hôm nay cần xử lý gì?');
    expect(markup).toContain('Chưa chọn workspace');
  });

  it('renders the action queue, KPI links, stage progress, and 30-day trend', async () => {
    await i18n.changeLanguage('vi');
    vi.mocked(useWorkspaceStore).mockReturnValue({
      activeWorkspaceId: 'workspace-1',
    } as never);
    vi.mocked(useDashboardQuery).mockReturnValue({
      data: dashboard,
      isError: false,
      isFetching: false,
      isLoading: false,
      refetch: vi.fn(),
    } as never);

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(markup).toContain('Việc cần xử lý');
    expect(markup).toContain('Chapter 1');
    expect(markup).toContain('Story 1');
    expect(markup).toContain('Tóm tắt');
    expect(markup).toContain('Tiến độ theo công đoạn');
    expect(markup).toContain('/stories/story-1/chapter/chapter-1');
    expect(markup).toContain('/deadline-extensions');
    expect(markup).toContain('/payroll');
  });

  it('renders loading, retry, and empty action states', async () => {
    await i18n.changeLanguage('vi');
    vi.mocked(useWorkspaceStore).mockReturnValue({
      activeWorkspaceId: 'workspace-1',
    } as never);

    vi.mocked(useDashboardQuery).mockReturnValue({
      data: undefined,
      isError: false,
      isFetching: true,
      isLoading: true,
      refetch: vi.fn(),
    } as never);
    const loadingMarkup = renderToStaticMarkup(<DashboardPage />);
    expect(loadingMarkup).toContain('min-h-96');

    vi.mocked(useDashboardQuery).mockReturnValue({
      data: undefined,
      error: new Error('Network error'),
      isError: true,
      isFetching: false,
      isLoading: false,
      refetch: vi.fn(),
    } as never);
    const errorMarkup = renderToStaticMarkup(<DashboardPage />);
    expect(errorMarkup).toContain('Không thể tải tổng quan');
    expect(errorMarkup).toContain('Thử lại');

    vi.mocked(useDashboardQuery).mockReturnValue({
      data: { ...dashboard, actionItems: [] },
      isError: false,
      isFetching: false,
      isLoading: false,
      refetch: vi.fn(),
    } as never);
    const emptyMarkup = renderToStaticMarkup(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(emptyMarkup).toContain('Workspace đang ổn');
  });
});
