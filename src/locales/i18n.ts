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
import viAuth from './vi/auth.json';
import viCommon from './vi/common.json';
import viDashboard from './vi/dashboard.json';
import viErrors from './vi/errors.json';
import viLayouts from './vi/layouts.json';
import viManagement from './vi/management.json';
import viMembers from './vi/members.json';
import viNavigation from './vi/navigation.json';

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
