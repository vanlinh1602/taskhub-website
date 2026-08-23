import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';

import { LoadingScreen } from '@/components/loading-screen';
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
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
