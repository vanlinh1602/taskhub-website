import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import i18n from '@/locales/i18n';
import StatisticsPage from '@/pages/Statistics';

describe('StatisticsPage', () => {
  it('renders a workspace selection state when no workspace is active', async () => {
    await i18n.changeLanguage('vi');
    const queryClient = new QueryClient();
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <StatisticsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(markup).toContain('Thống kê task');
    expect(markup).toContain('Chọn workspace');
  });
});
