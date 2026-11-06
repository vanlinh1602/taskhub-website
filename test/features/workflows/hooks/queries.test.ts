import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { workflowQueryKeys } from '@/features/workflows/hooks';

describe('workflow search cache', () => {
  it('keeps results for different search terms separate', () => {
    const client = new QueryClient();
    const review = workflowQueryKeys.list('workspace', ['ACTIVE'], 0, 25, 'review');
    const translate = workflowQueryKeys.list('workspace', ['ACTIVE'], 0, 25, 'translate');

    client.setQueryData(review, { items: [{ id: 'review-template' }] });
    client.setQueryData(translate, { items: [{ id: 'translation-template' }] });

    expect(client.getQueryData(review)).toEqual({ items: [{ id: 'review-template' }] });
    expect(client.getQueryData(translate)).toEqual({ items: [{ id: 'translation-template' }] });
  });

  it('invalidates every search result after a template mutation', async () => {
    const client = new QueryClient();
    const queryKey = workflowQueryKeys.list('workspace', ['ACTIVE'], 0, 25, 'review');
    client.setQueryData(queryKey, { items: [] });

    await client.invalidateQueries({ queryKey: workflowQueryKeys.listRoot('workspace') });

    expect(client.getQueryState(queryKey)?.isInvalidated).toBe(true);
  });
});
