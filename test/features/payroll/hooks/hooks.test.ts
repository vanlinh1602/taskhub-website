import { describe, expect, it } from 'vitest';

import { payrollQueryKeys } from '@/features/payroll/hooks';

describe('payroll query keys', () => {
  it('keeps workspace, recipient, status, and pagination in detail keys', () => {
    expect(
      payrollQueryKeys.detail('workspace-1', 'member-1', {
        status: 'PAID',
        page: 2,
        pageSize: 25,
      }),
    ).toEqual([
      'payroll',
      'detail',
      'workspace-1',
      'member-1',
      { status: 'PAID', page: 2, pageSize: 25 },
    ]);
  });

  it('changes list and detail keys when the paid date range changes', () => {
    const query = {
      status: 'PAID' as const,
      page: 0,
      pageSize: 25,
      from: '2026-08-01',
      to: '2026-08-31',
    };

    expect(payrollQueryKeys.list('workspace-1', query)).toContain(query);
    expect(
      payrollQueryKeys.detail('workspace-1', 'member-1', query),
    ).toContain(query);
    expect(payrollQueryKeys.list('workspace-1', query)).not.toEqual(
      payrollQueryKeys.list('workspace-1', {
        ...query,
        from: '2026-09-01',
        to: '2026-09-30',
      }),
    );
  });

  it('keeps list and detail invalidation roots separate from QR blobs', () => {
    expect(payrollQueryKeys.listRoot()).toEqual(['payroll', 'list']);
    expect(payrollQueryKeys.detailRoot()).toEqual(['payroll', 'detail']);
    expect(payrollQueryKeys.bankQr('workspace-1', 'member-1')).toEqual([
      'payroll',
      'bank-qr',
      'workspace-1',
      'member-1',
    ]);
  });
});
