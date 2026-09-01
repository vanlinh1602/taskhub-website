import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { LoadingScreen } from '@/components/loading-screen';
import { AppLayout, DEFAULT_PROTECTED_PATH } from '@/features/layouts';
import FirebaseAuthObserver from '@/features/user/components/FirebaseAuthObserver';

import AuthRouter from './AuthRouter';

const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const DeadlineExtensionsPage = lazy(() => import('@/pages/DeadlineExtensions'));
const ManagementPlaceholderPage = lazy(
  () => import('@/pages/ManagementPlaceholder'),
);
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const StoriesPage = lazy(() => import('@/pages/Stories'));
const StoryDetailPage = lazy(() => import('@/pages/Stories/Detail'));
const ChapterDetailPage = lazy(() => import('@/pages/Stories/ChapterDetail'));
const LoginPage = lazy(() => import('@/pages/Login'));
const MembersPage = lazy(() => import('@/pages/Members'));
const TasksPage = lazy(() => import('@/pages/Tasks'));
const StagesPage = lazy(() => import('@/pages/Stages'));
const WorkspaceSettingsPage = lazy(() => import('@/pages/WorkspaceSettings'));

function App() {
  return (
    <BrowserRouter>
      <FirebaseAuthObserver />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={<AuthRouter />}>
            <Route element={<AppLayout />}>
              <Route
                index
                element={<Navigate to={DEFAULT_PROTECTED_PATH} replace />}
              />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route
                path="deadline-extensions"
                element={<DeadlineExtensionsPage />}
              />
              <Route path="members" element={<MembersPage />} />
              <Route path="payroll" element={<ManagementPlaceholderPage />} />
              <Route path="stages" element={<StagesPage />} />
              <Route path="stories" element={<StoriesPage />} />
              <Route path="stories/:storyId" element={<StoryDetailPage />} />
              <Route
                path="stories/:storyId/chapter/:chapterId"
                element={<ChapterDetailPage />}
              />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="workflows" element={<ManagementPlaceholderPage />} />
              <Route
                path="workspace-settings"
                element={<WorkspaceSettingsPage />}
              />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
