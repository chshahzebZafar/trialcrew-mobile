/**
 * Active-role store (Zustand + persist). Client UI state — the person's currently
 * selected role. Server data still flows through TanStack Query; auth/onboarding
 * keep their own stores. `switchSeq` increments only on an explicit user toggle
 * (not on rehydrate), so the role-transition animation never fires on cold start.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Role } from "@/types";

interface RoleState {
  role: Role;
  switchSeq: number; // bumps on each user toggle → drives the transition overlay
  hydrated: boolean;
  setRole: (role: Role) => void;
  toggleRole: () => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      role: "TESTER",
      switchSeq: 0,
      hydrated: false,
      setRole: (role) => {
        if (role === get().role) return;
        set((s) => ({ role, switchSeq: s.switchSeq + 1 }));
      },
      toggleRole: () =>
        set((s) => ({
          role: s.role === "TESTER" ? "FOUNDER" : "TESTER",
          switchSeq: s.switchSeq + 1,
        })),
    }),
    {
      name: "tc.role",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ role: s.role }), // never persist switchSeq/hydrated
      onRehydrateStorage: () => () => {
        useRoleStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Convenience selectors. */
export const useRole = () => useRoleStore((s) => s.role);
export const useIsFounder = () => useRoleStore((s) => s.role === "FOUNDER");
