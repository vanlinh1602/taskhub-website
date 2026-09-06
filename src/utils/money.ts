const DEFAULT_MONEY_LOCALE = 'vi-VN';
const MAX_MONEY_FRACTION_DIGITS = 2;
const DEFAULT_GROUP_SEPARATOR = ',';
const DEFAULT_DECIMAL_SEPARATOR = '.';

interface MoneySeparators {
  readonly decimal: string;
  readonly group: string;
}

function createMoneyFormatter(language: string): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(language || DEFAULT_MONEY_LOCALE, {
      maximumFractionDigits: MAX_MONEY_FRACTION_DIGITS,
      minimumFractionDigits: 0,
    });
  } catch {
    return new Intl.NumberFormat(DEFAULT_MONEY_LOCALE, {
      maximumFractionDigits: MAX_MONEY_FRACTION_DIGITS,
      minimumFractionDigits: 0,
    });
  }
}

function getMoneySeparators(formatter: Intl.NumberFormat): MoneySeparators {
  const parts = formatter.formatToParts(1000.5);
  return {
    decimal:
      parts.find((part) => part.type === 'decimal')?.value ??
      DEFAULT_DECIMAL_SEPARATOR,
    group:
      parts.find((part) => part.type === 'group')?.value ??
      DEFAULT_GROUP_SEPARATOR,
  };
}

export function formatMoney(
  value: number | string | null | undefined,
  currency: string,
  language: string,
): string {
  if (value === null || value === undefined || value === '') return '—';
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency}`;
  return `${createMoneyFormatter(language).format(amount)} ${currency}`;
}

export function formatMoneyInput(value: string, language: string): string {
  if (!value) return '';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  const formatter = createMoneyFormatter(language);
  const formattedValue = formatter.format(amount);
  if (!value.endsWith('.')) return formattedValue;
  return `${formattedValue}${getMoneySeparators(formatter).decimal}`;
}

export function parseMoneyInput(value: string, language: string): string {
  const sanitizedValue = value.replace(/[^\d.,]/g, '');
  if (!sanitizedValue) return '';

  const formatter = createMoneyFormatter(language);
  const { decimal, group } = getMoneySeparators(formatter);
  const decimalIndex = sanitizedValue.lastIndexOf(decimal);

  if (decimalIndex < 0) return sanitizedValue.replace(/[.,]/g, '');

  const integerPart = sanitizedValue
    .slice(0, decimalIndex)
    .replace(group, '')
    .replace(/[.,]/g, '');
  const fractionPart = sanitizedValue
    .slice(decimalIndex + decimal.length)
    .replace(/[.,]/g, '')
    .slice(0, MAX_MONEY_FRACTION_DIGITS);

  return `${integerPart || '0'}.${fractionPart}`;
}
