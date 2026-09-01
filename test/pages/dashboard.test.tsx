import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import i18n from '@/locales/i18n';
import DashboardPage from '@/pages/Dashboard';

describe('DashboardPage', () => {
  it('renders the dashboard heading without an active workspace', async () => {
    await i18n.changeLanguage('vi');
    const queryClient = new QueryClient();
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    expect(markup).toContain('Tổng quan vận hành');
    expect(markup).toContain('Điều phối workspace');
  });
});
