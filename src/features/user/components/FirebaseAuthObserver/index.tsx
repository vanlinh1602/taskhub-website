import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/shallow';

import { useUserStore } from '@/features/user/hooks';
import i18n from '@/locales/i18n';
import { translations } from '@/locales/translations';
import { auth } from '@/services/firebase';

export default function FirebaseAuthObserver() {
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
        toast.error(i18n.t(translations.errors.login), {
          description: i18n.t(translations.errors.unknown),
        });
      });
    });
  }, [authUser]);

  return null;
}
