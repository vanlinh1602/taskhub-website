import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { toast } from 'sonner';
import { useShallow } from 'zustand/shallow';

import { authorizeExtension } from '@/features/user/api';
import { useUserStore } from '@/features/user/hooks';
import { translations } from '@/locales/translations';
import { auth } from '@/services/firebase';

import { getExtensionAuthorization, handleFirebaseAuthentication } from '../../utils/extensionAuthorization';

export default function FirebaseAuthObserver() {
  const { t } = useTranslation();
  const location = useLocation();
  const { authUser } = useUserStore(
    useShallow((state) => ({
      authUser: state.authUser,
    })),
  );
  const authorization = useMemo(
    () => getExtensionAuthorization(new URLSearchParams(location.search)),
    [location.search],
  );
  const handledAuthorization = useRef<string | undefined>(undefined);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      const authorizationKey = authorization ? JSON.stringify(authorization) : undefined;
      if (authorizationKey && firebaseUser) {
        if (handledAuthorization.current === authorizationKey) {
          return;
        }
        handledAuthorization.current = authorizationKey;
      }

      void handleFirebaseAuthentication({
        authorization,
        authenticateUser: authUser,
        authorizeExtension,
        isAuthenticated: Boolean(firebaseUser),
        redirect: (callbackUrl: string) => window.location.assign(callbackUrl),
      }).catch(() => {
        toast.error(t(translations.errors.login), {
          description: t(translations.errors.unknown),
        });
      });
    });
  }, [authUser, authorization, t]);

  return null;
}
