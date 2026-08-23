import { t } from 'i18next';
import { toast } from 'sonner';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

import { authUser, logoutUser } from '../api';
import { UserStore, UserStoreActions } from '../type';

const initialState: UserStore = {
  user: undefined,
  handling: false,
};

export const useUserStore = create<UserStore & UserStoreActions>()(
  devtools((set) => ({
    ...initialState,
    authUser: async () => {
      set(
        () => ({
          handling: true,
        }),
        false,
        'user/authUser',
      );
      try {
        const user = await authUser();
        set(
          () => ({
            user,
            handling: false,
          }),
          false,
          'user/authUser',
        );
      } catch (error: any) {
        toast.error(t(translations.errors.login), {
          description: formatError(error),
        });
        set(
          () => ({
            handling: false,
          }),
          false,
          'user/authUser',
        );
      }
    },

    logout: async () => {
      set(
        () => ({
          handling: true,
        }),
        false,
        'user/logout',
      );
      try {
        await logoutUser();
        set(() => initialState, false, 'user/logout');
      } catch (error: any) {
        toast.error(t(translations.errors.login), {
          description: formatError(error),
        });
      }
    },
  })),
);
