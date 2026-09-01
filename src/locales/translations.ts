import type { ConvertedToObjectType, TranslationJsonType } from './types';
import viAuth from './vi/auth.json';
import viCommon from './vi/common.json';
import viDashboard from './vi/dashboard.json';
import viErrors from './vi/errors.json';
import viLayouts from './vi/layouts.json';
import viManagement from './vi/management.json';
import viMembers from './vi/members.json';
import viNavigation from './vi/navigation.json';
import viStages from './vi/stages.json';
import viWorkspaceSettings from './vi/workspace-settings.json';

const vi = {
  auth: viAuth,
  common: viCommon,
  dashboard: viDashboard,
  errors: viErrors,
  layouts: viLayouts,
  members: viMembers,
  management: viManagement,
  navigation: viNavigation,
  stages: viStages,
  workspaceSettings: viWorkspaceSettings,
} satisfies TranslationJsonType;

function convertValue(value: unknown, currentKey: string): unknown {
  if (typeof value !== 'object' || value === null) {
    return currentKey;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, childValue]) => {
      const childKey = currentKey ? `${currentKey}.${key}` : key;
      return [key, convertValue(childValue, childKey)];
    }),
  );
}

export function convertLanguageJsonToObject(
  json: TranslationJsonType,
): ConvertedToObjectType<TranslationJsonType> {
  return convertValue(json, '') as ConvertedToObjectType<TranslationJsonType>;
}

export const translations = convertLanguageJsonToObject(vi);
