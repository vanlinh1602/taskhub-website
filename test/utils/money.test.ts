import { describe, expect, it } from 'vitest';

import {
  formatMoney,
  formatMoneyInput,
  parseMoneyInput,
} from '@/utils/money';

describe('money formatting', () => {
  it('formats Vietnamese amounts with thousand separators and no trailing zeros', () => {
    expect(formatMoney('1250000.00', 'VND', 'vi-VN')).toBe('1.250.000 VND');
    expect(formatMoneyInput('1250000.00', 'vi-VN')).toBe('1.250.000');
  });

  it('formats decimal amounts without dropping meaningful decimals', () => {
    expect(formatMoney('1250000.5', 'USD', 'en-US')).toBe('1,250,000.5 USD');
  });

  it('normalizes grouped input into the API decimal format', () => {
    expect(parseMoneyInput('1.250.000,5', 'vi-VN')).toBe('1250000.5');
    expect(parseMoneyInput('1,250,000.50', 'en-US')).toBe('1250000.50');
    expect(parseMoneyInput('1.250', 'vi-VN')).toBe('1250');
    expect(parseMoneyInput('1,25', 'vi-VN')).toBe('1.25');
  });
});
