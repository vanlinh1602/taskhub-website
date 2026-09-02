import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import i18n from '@/locales/i18n';
import PayrollPage from '@/pages/Payroll';

describe('PayrollPage', () => {
  it('renders a workspace selection state when no workspace is active', async () => {
    await i18n.changeLanguage('vi');
    const queryClient = new QueryClient();
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <PayrollPage />
      </QueryClientProvider>,
    );

    expect(markup).toContain('Thanh toán');
    expect(markup).toContain('Chọn workspace');
  });
});
