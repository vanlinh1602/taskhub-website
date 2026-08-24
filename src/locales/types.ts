import type viAuth from './vi/auth.json';
import type viCommon from './vi/common.json';
import type viDashboard from './vi/dashboard.json';
import type viErrors from './vi/errors.json';
import type viLayouts from './vi/layouts.json';
import type viManagement from './vi/management.json';
import type viNavigation from './vi/navigation.json';

export type ConvertedToObjectType<T> = {
  [Property in keyof T]: T[Property] extends string
    ? string
    : ConvertedToObjectType<T[Property]>;
};

export interface TranslationJsonType {
  readonly auth: typeof viAuth;
  readonly common: typeof viCommon;
  readonly dashboard: typeof viDashboard;
  readonly errors: typeof viErrors;
  readonly layouts: typeof viLayouts;
  readonly management: typeof viManagement;
  readonly navigation: typeof viNavigation;
}
