import '@/locales/i18n';

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppSidebar from '@/features/layouts/components/AppSidebar';

describe('AppSidebar', () => {
  it('marks Dashboard as active on the Dashboard route', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/dashboard']}>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    expect(markup).toContain('data-active="true"');
    expect(markup).toContain('Taskory Hub');
  });

  it('keeps an icon-only navigation state when collapsed', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/dashboard']}>
        <TooltipProvider>
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
          </SidebarProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    expect(markup).toContain('data-collapsible="icon"');
  });
});
