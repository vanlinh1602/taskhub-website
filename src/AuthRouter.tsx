import { Navigate, Outlet, useLocation } from 'react-router';
import { useShallow } from 'zustand/shallow';

import { LoadingScreen } from '@/components/loading-screen';

import { useUserStore } from './features/user/hooks';

function AuthRouter() {
  const location = useLocation();
  const { user, isLoading } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      isLoading: state.handling,
    })),
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user?.id) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet />;
}

export default AuthRouter;
