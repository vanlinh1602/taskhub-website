import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteWorkflowTemplate,
  getWorkflowTemplate,
  getWorkflowTemplates,
  saveWorkflowTemplate,
} from '@/features/workflows/apis';
import { backendService } from '@/services';

describe('workflow APIs', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('encodes workspace and template IDs and serializes repeated status filters', async () => {
    const page = { items: [], page: 1, pageCount: 2, total: 0 };
    const get = vi
      .spyOn(backendService, 'get')
      .mockResolvedValue({ kind: 'ok', data: page } as never);

    await expect(
      getWorkflowTemplates('guild/id', ['DRAFT', 'ACTIVE'], 1, 100),
    ).resolves.toBe(page);
    await getWorkflowTemplate('guild/id', '12/1');

    expect(get).toHaveBeenNthCalledWith(
      1,
      '/api/story-workflow/guild%2Fid/workflow-templates?page=1&pageSize=25&status=DRAFT&status=ACTIVE',
    );
    expect(get).toHaveBeenNthCalledWith(
      2,
      '/api/story-workflow/guild%2Fid/workflow-templates/12%2F1',
    );
  });

  it('sends the graph payload with nullable override fallbacks', async () => {
    const put = vi
      .spyOn(backendService, 'put')
      .mockResolvedValue({ kind: 'ok', data: { id: '5' } } as never);
    const payload = {
      name: 'Workflow',
      steps: [
        {
          stages: [
            {
              stageDefinitionId: '1',
              prerequisiteStageDefinitionIds: [],
              durationHours: null,
              priceOverride: null,
            },
          ],
        },
      ],
    } as const;

    await saveWorkflowTemplate('guild/id', '5/1', payload);

    expect(put).toHaveBeenCalledWith(
      '/api/story-workflow/guild%2Fid/workflow-templates/5%2F1',
      payload,
    );
  });

  it('uses the encoded delete endpoint for drafts', async () => {
    const remove = vi
      .spyOn(backendService, 'delete')
      .mockResolvedValue({ kind: 'ok', data: null } as never);

    await deleteWorkflowTemplate('guild/id', 'draft/5');

    expect(remove).toHaveBeenCalledWith(
      '/api/story-workflow/guild%2Fid/workflow-templates/draft%2F5',
    );
  });
});
