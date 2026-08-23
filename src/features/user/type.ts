export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
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
  updateUser: (userId: number, user: Partial<User>) => Promise<boolean>;
  setActiveTeam: (teamId: number) => void;
  setActiveTeamAsync: (teamId: number) => Promise<void>;
};
