import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createPayrollBatch,
  createPayrollQuery,
  getPayrollBankQr,
  getPayrollBatch,
  getPayrollBatches,
  getPayrollRecipient,
  getPayrollRecipients,
  payPayrollBatchRecipient,
  recalculatePayrollRewards,
} from '@/features/payroll/apis';
import { backendService } from '@/services';

describe('payroll APIs', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('loads a workspace recipient page with status and pagination', async () => {
    const page = { items: [], page: 1, pageCount: 2, total: 26 };
    const get = vi
      .spyOn(backendService, 'get')
      .mockResolvedValue({ kind: 'ok', data: page } as never);

    await expect(
      getPayrollRecipients('workspace id', {
        status: 'PAID',
        page: 1,
        pageSize: 25,
      }),
    ).resolves.toBe(page);

    expect(get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%20id/payroll/recipients?status=PAID&page=1&pageSize=25',
    );
  });

  it('loads recipient details and the protected bank QR blob', async () => {
    const detail = {
      recipient: { discordUserId: 'member-1' },
      bankQr: { configured: true, fileName: 'qr.png' },
      tasks: [],
      page: 0,
      pageCount: 1,
      total: 0,
    };
    const get = vi
      .spyOn(backendService, 'get')
      .mockResolvedValue({ kind: 'ok', data: detail } as never);
    const blob = new Blob(['qr']);
    const getBlob = vi
      .spyOn(backendService, 'getBlob')
      .mockResolvedValue({ kind: 'ok', data: blob });

    await expect(
      getPayrollRecipient('workspace/id', 'member/id', {
        status: 'PENDING',
        page: 0,
        pageSize: 25,
      }),
    ).resolves.toBe(detail);
    await expect(getPayrollBankQr('workspace/id', 'member/id')).resolves.toBe(
      blob,
    );

    expect(get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/payroll/recipients/member%2Fid?status=PENDING&page=0&pageSize=25',
    );
    expect(getBlob).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/payroll/recipients/member%2Fid/bank-qr',
    );
  });

  it('serializes an optional paid date range only when provided', () => {
    expect(
      createPayrollQuery({
        status: 'PAID',
        page: 0,
        pageSize: 25,
        from: '2026-08-01',
        to: '2026-08-31',
      }),
    ).toBe('status=PAID&page=0&pageSize=25&from=2026-08-01&to=2026-08-31');
    expect(
      createPayrollQuery({ status: 'PAID', page: 0, pageSize: 25 }),
    ).toBe('status=PAID&page=0&pageSize=25');
    expect(
      createPayrollQuery({
        status: 'PAID',
        page: 0,
        pageSize: 25,
        from: '2026-08-01',
      }),
    ).toBe('status=PAID&page=0&pageSize=25');
    expect(
      createPayrollQuery({
        status: 'PENDING',
        page: 0,
        pageSize: 25,
        from: '2026-08-01',
        to: '2026-08-31',
      }),
    ).toBe('status=PENDING&page=0&pageSize=25');
  });

  it('creates a payroll batch and normalizes its numeric ID', async () => {
    const batch = { id: 42, taskCount: 10 };
    const post = vi
      .spyOn(backendService, 'post')
      .mockResolvedValue({ kind: 'ok', data: batch } as never);

    await expect(
      createPayrollBatch('workspace/id', '2026-08-31T17:00:00.000Z'),
    ).resolves.toEqual({ id: '42', taskCount: 10 });

    expect(post).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/payroll/batches',
      { cutoffAt: '2026-08-31T17:00:00.000Z' },
    );
  });

  it('normalizes numeric batch IDs returned by the API', async () => {
    const get = vi.spyOn(backendService, 'get').mockResolvedValue(
      { kind: 'ok', data: [{ id: 42 }] } as never,
    );

    await expect(getPayrollBatches('workspace/id')).resolves.toEqual([
      { id: '42' },
    ]);

    expect(get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/payroll/batches',
    );
  });

  it('loads batch task pages and pays the selected batch recipient', async () => {
    const detail = { id: 42, tasks: [], recipients: [] };
    const get = vi
      .spyOn(backendService, 'get')
      .mockResolvedValue({ kind: 'ok', data: detail } as never);
    const payment = { batchId: 'batch-1', taskCount: 10 };
    const post = vi
      .spyOn(backendService, 'post')
      .mockResolvedValue({ kind: 'ok', data: payment } as never);

    await expect(
      getPayrollBatch('workspace/id', 'batch/1', {
        recipientDiscordUserId: 'member/id',
        page: 2,
        pageSize: 25,
      }),
    ).resolves.toEqual({ ...detail, id: '42' });
    await expect(
      payPayrollBatchRecipient('workspace/id', 'batch/1', 'member/id'),
    ).resolves.toBe(payment);

    expect(get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/payroll/batches/batch%2F1?page=2&pageSize=25&recipientDiscordUserId=member%2Fid',
    );
    expect(post).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/payroll/batches/batch%2F1/recipients/member%2Fid/pay',
    );
  });

  it('recalculates unpaid payroll rewards for the whole workspace', async () => {
    const result = {
      processedTaskCount: 12,
      updatedTaskCount: 7,
      recipientCount: 2,
      rewardTotal: 7000,
    };
    const post = vi
      .spyOn(backendService, 'post')
      .mockResolvedValue({ kind: 'ok', data: result } as never);

    await expect(recalculatePayrollRewards('workspace/id')).resolves.toBe(
      result,
    );

    expect(post).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/payroll/recalculate-rewards',
    );
  });
});
