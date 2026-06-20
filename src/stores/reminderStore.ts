/**
 * Daily check-in reminder preference (Zustand + persist). The actual scheduling is
 * done via src/lib/push.ts; this store only holds the user's choice (enabled + time).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  cancelDailyCheckInReminder,
  scheduleDailyCheckInReminder,
} from "@/lib/push";

interface ReminderState {
  enabled: boolean;
  hour: number;
  minute: number;
  /** Enable + schedule. Returns false if permission denied. */
  enable: (hour: number, minute: number) => Promise<boolean>;
  /** Re-schedule at a new time (only if currently enabled). */
  setTime: (hour: number, minute: number) => Promise<void>;
  disable: () => Promise<void>;
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      enabled: false,
      hour: 9,
      minute: 0,
      enable: async (hour, minute) => {
        const ok = await scheduleDailyCheckInReminder(hour, minute);
        if (ok) set({ enabled: true, hour, minute });
        return ok;
      },
      setTime: async (hour, minute) => {
        set({ hour, minute });
        if (get().enabled) await scheduleDailyCheckInReminder(hour, minute);
      },
      disable: async () => {
        await cancelDailyCheckInReminder();
        set({ enabled: false });
      },
    }),
    {
      name: "tc.reminder",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ enabled: s.enabled, hour: s.hour, minute: s.minute }),
    },
  ),
);
