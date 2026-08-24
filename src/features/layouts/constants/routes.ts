export const ROUTES = {
  CHAPTERS: '/chapters',
  DASHBOARD: '/dashboard',
  DEADLINE_EXTENSIONS: '/deadline-extensions',
  LOGIN: '/login',
  MEMBERS: '/members',
  PAYROLL: '/payroll',
  STAGES: '/stages',
  STORIES: '/stories',
  TASKS: '/tasks',
  WORKFLOWS: '/workflows',
  WORKSPACE_SETTINGS: '/workspace-settings',
} as const;

export const DEFAULT_PROTECTED_PATH = ROUTES.DASHBOARD;
