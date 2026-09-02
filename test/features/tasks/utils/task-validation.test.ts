import { describe, expect, it } from 'vitest';

import {
  canDeductTask,
  hasDeductionReason,
  isValidDeductionAmount,
  isValidTaskPrice,
} from '@/features/tasks/utils/task-validation';

describe('task action validation', () => {
  it('validates non-negative prices to two decimal places', () => {
    expect(isValidTaskPrice('0')).toBe(true);
    expect(isValidTaskPrice('12.50')).toBe(true);
    expect(isValidTaskPrice('12.345')).toBe(false);
    expect(isValidTaskPrice('-1')).toBe(false);
  });

  it('validates positive deductions and required reasons', () => {
    expect(isValidDeductionAmount('0.01')).toBe(true);
    expect(isValidDeductionAmount('0')).toBe(false);
    expect(isValidDeductionAmount('1.234')).toBe(false);
    expect(hasDeductionReason('  late delivery  ')).toBe(true);
    expect(hasDeductionReason('   ')).toBe(false);
  });

  it('blocks deductions after payment', () => {
    expect(canDeductTask('PENDING')).toBe(true);
    expect(canDeductTask('PAID')).toBe(false);
  });
});
