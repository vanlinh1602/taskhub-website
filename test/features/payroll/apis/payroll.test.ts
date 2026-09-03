import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createPayrollQuery,
  getPayrollBankQr,
  getPayrollRecipient,
  getPayrollRecipients,
  payPayrollRecipient,
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

  it('marks all pending payroll tasks for a recipient as paid', async () => {
    const payment = { taskCount: 10 };
    const post = vi
      .spyOn(backendService, 'post')
      .mockResolvedValue({ kind: 'ok', data: payment } as never);

    await expect(
      payPayrollRecipient('workspace/id', 'member/id'),
    ).resolves.toBe(payment);

    expect(post).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/payroll/recipients/member%2Fid/pay',
    );
  });
});
