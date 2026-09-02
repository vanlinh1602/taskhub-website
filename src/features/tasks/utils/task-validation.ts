import type { PaymentStatus } from '../types';

const decimalAmountPattern = /^\d+(?:\.\d{1,2})?$/;

export function isValidTaskPrice(value: string): boolean {
  return decimalAmountPattern.test(value);
}

export function isValidDeductionAmount(value: string): boolean {
  return decimalAmountPattern.test(value) && Number(value) > 0;
}

export function hasDeductionReason(value: string): boolean {
  return value.trim().length > 0;
}

export function canDeductTask(paymentStatus: PaymentStatus): boolean {
  return paymentStatus !== 'PAID';
}
