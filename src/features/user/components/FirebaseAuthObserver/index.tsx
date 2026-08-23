import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useShallow } from 'zustand/shallow';

import { useUserStore } from '@/features/user/hooks';
import { translations } from '@/locales/translations';
import { auth } from '@/services/firebase';

export default function FirebaseAuthObserver() {
  const { t } = useTranslation();
  const { authUser } = useUserStore(
    useShallow((state) => ({
      authUser: state.authUser,
    })),
  );
  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        return;
      }

      void authUser().catch(() => {
        toast.error(t(translations.errors.login), {
          description: t(translations.errors.unknown),
        });
      });
    });
  }, [authUser, t]);

  return null;
}
