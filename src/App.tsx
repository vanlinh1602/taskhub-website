import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { LoadingScreen } from '@/components/loading-screen';
import { AppLayout, DEFAULT_PROTECTED_PATH } from '@/features/layouts';
import FirebaseAuthObserver from '@/features/user/components/FirebaseAuthObserver';

import AuthRouter from './AuthRouter';

const DashboardPage = lazy(() => import('@/pages/Dashboard'));
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
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
