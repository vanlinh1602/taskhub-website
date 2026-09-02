import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enAuth from './en/auth.json';
import enCommon from './en/common.json';
import enDashboard from './en/dashboard.json';
import enErrors from './en/errors.json';
import enLayouts from './en/layouts.json';
import enManagement from './en/management.json';
import enMembers from './en/members.json';
import enNavigation from './en/navigation.json';
import enStages from './en/stages.json';
import enStatistics from './en/statistics.json';
import enWorkflows from './en/workflows.json';
import enWorkspaceSettings from './en/workspace-settings.json';
import viAuth from './vi/auth.json';
import viCommon from './vi/common.json';
import viDashboard from './vi/dashboard.json';
import viErrors from './vi/errors.json';
import viLayouts from './vi/layouts.json';
import viManagement from './vi/management.json';
import viMembers from './vi/members.json';
import viNavigation from './vi/navigation.json';
import viStages from './vi/stages.json';
import viStatistics from './vi/statistics.json';
import viWorkflows from './vi/workflows.json';
import viWorkspaceSettings from './vi/workspace-settings.json';

export const translationsJson = {
  en: {
    translation: {
      auth: enAuth,
      common: enCommon,
      dashboard: enDashboard,
      errors: enErrors,
      layouts: enLayouts,
      members: enMembers,
      management: enManagement,
      navigation: enNavigation,
      stages: enStages,
      statistics: enStatistics,
      workspaceSettings: enWorkspaceSettings,
      workflows: enWorkflows,
    },
  },
  vi: {
    translation: {
      auth: viAuth,
      common: viCommon,
      dashboard: viDashboard,
      errors: viErrors,
      layouts: viLayouts,
      members: viMembers,
      management: viManagement,
      navigation: viNavigation,
      stages: viStages,
      statistics: viStatistics,
      workspaceSettings: viWorkspaceSettings,
      workflows: viWorkflows,
    },
  },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'vi',
    interpolation: { escapeValue: false },
    resources: translationsJson,
  });

export default i18n;
