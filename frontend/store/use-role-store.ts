import { create } from 'zustand';

import type { Role } from '@/lib/role';

export type { Role };

type RoleState = {
  role: Role | null;
  setRole: (role: Role) => void;
  clearRole: () => void;
};

/**
 * Ephemeral signup helper only. Prefer readRoleFromMetadata(session) for
 * deciding which portal a signed-in user belongs to.
 */
export const useRoleStore = create<RoleState>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
  clearRole: () => set({ role: null }),
}));
