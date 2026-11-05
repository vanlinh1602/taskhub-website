import type { useTranslation } from 'react-i18next';

import type {
  StatisticsPaymentStatus,
  StatisticsTaskStatus,
} from '@/features/statistics/types';
import { translations } from '@/locales/translations';

export function statusLabel(
  status: StatisticsTaskStatus,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  const keys: Record<StatisticsTaskStatus, string> = {
    BLOCKED: translations.statistics.statusBlocked,
    READY: translations.statistics.statusReady,
    IN_PROGRESS: translations.statistics.statusInProgress,
    COMPLETED: translations.statistics.statusCompleted,
    CANCELLED: translations.statistics.statusCancelled,
  };
  return t(keys[status]);
}

export function paymentLabel(
  status: StatisticsPaymentStatus,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  const keys: Record<StatisticsPaymentStatus, string> = {
    NOT_READY: translations.statistics.paymentNotReady,
    PENDING: translations.statistics.paymentPending,
    PAID: translations.statistics.paymentPaid,
  };
  return t(keys[status]);
}

export function formatDate(
  value: string | null,
  language: string,
  fallback: string,
): string {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback
    : new Intl.DateTimeFormat(language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}
