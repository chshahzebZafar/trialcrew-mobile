/**
 * Onboarding-seen flag, persisted so the intro slides only show on first launch.
 * Same store pattern as auth: `hydrated` flips true once the flag is read.
 */
import { useSyncExternalStore } from "react";
import { readJSON, writeJSON, StorageKeys } from "./storage";

interface OnboardingState {
  hasOnboarded: boolean;
  hydrated: boolean;
}

let state: OnboardingState = { hasOnboarded: false, hydrated: false };
const listeners = new Set<() => void>();

function setState(next: Partial<OnboardingState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

async function hydrate() {
  const seen = await readJSON<boolean>(StorageKeys.onboarded);
  setState({ hasOnboarded: seen === true, hydrated: true });
}
void hydrate();

export const onboardingStore = {
  async complete() {
    setState({ hasOnboarded: true });
    await writeJSON(StorageKeys.onboarded, true);
  },
};

export function useOnboarding() {
  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
  return {
    hydrated: snapshot.hydrated,
    hasOnboarded: snapshot.hasOnboarded,
    complete: onboardingStore.complete,
  };
}
