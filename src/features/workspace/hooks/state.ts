import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Workspace } from '@/features/admin/types';

interface WorkspaceState {
  readonly activeWorkspaceId: string;
  setActiveWorkspace: (workspace: Workspace | undefined) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    (set) => ({
      activeWorkspaceId: '',
      setActiveWorkspace: (workspace) => {
        set(
          { activeWorkspaceId: workspace?.id ?? '' },
          false,
          'workspace/setActiveWorkspace',
        );
      },
    }),
    { name: 'workspace' },
  ),
);
