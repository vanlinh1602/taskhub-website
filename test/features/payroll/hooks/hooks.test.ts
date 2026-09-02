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
