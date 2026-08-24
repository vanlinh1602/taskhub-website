import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { LoadingScreen } from '@/components/loading-screen';
import { AppLayout, DEFAULT_PROTECTED_PATH } from '@/features/layouts';
import FirebaseAuthObserver from '@/features/user/components/FirebaseAuthObserver';

import AuthRouter from './AuthRouter';

const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const ManagementPlaceholderPage = lazy(
  () => import('@/pages/ManagementPlaceholder'),
);
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const LoginPage = lazy(() => import('@/pages/Login'));

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
              <Route path="chapters" element={<ManagementPlaceholderPage />} />
              <Route
                path="deadline-extensions"
                element={<ManagementPlaceholderPage />}
              />
              <Route path="members" element={<ManagementPlaceholderPage />} />
              <Route path="payroll" element={<ManagementPlaceholderPage />} />
              <Route path="stages" element={<ManagementPlaceholderPage />} />
              <Route path="stories" element={<ManagementPlaceholderPage />} />
              <Route path="tasks" element={<ManagementPlaceholderPage />} />
              <Route path="workflows" element={<ManagementPlaceholderPage />} />
              <Route
                path="workspace-settings"
                element={<ManagementPlaceholderPage />}
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
