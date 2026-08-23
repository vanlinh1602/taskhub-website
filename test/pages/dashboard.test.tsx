import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import i18n from '@/locales/i18n';
import DashboardPage from '@/pages/Dashboard';

describe('DashboardPage', () => {
  it('renders the workspace-ready empty state', async () => {
    await i18n.changeLanguage('vi');
    const markup = renderToStaticMarkup(<DashboardPage />);

    expect(markup).toContain('Không gian làm việc đã sẵn sàng');
    expect(markup).toContain('Mọi quy trình của bạn sẽ bắt đầu tại đây');
  });
});
