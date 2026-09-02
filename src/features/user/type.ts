export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  discordUserId: string;
  gender: string;
  avatar: string;
  phone: string;
  address: string;
  bio: string;
  permissions?: {
    isAdmin?: boolean;
    teams?: {
      teamId: number;
      role: string;
      name: string;
    }[];
    activeTeam?: number;
  };
};

export type UserStore = {
  user?: User;
  handling: boolean;
};

export type UserStoreActions = {
  authUser: () => Promise<void>;
  logout: () => Promise<void>;
};
