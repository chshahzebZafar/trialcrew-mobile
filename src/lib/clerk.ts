/**
 * Clerk config + token plumbing. Clerk activates only when the publishable key is
 * present (EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) — otherwise the app uses the stub auth,
 * so it still runs with no key set.
 */
import * as SecureStore from "expo-secure-store";

export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
export const CLERK_ENABLED = CLERK_PUBLISHABLE_KEY.length > 0;

/** Persist Clerk's JWT in the device secure store. */
export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore
    }
  },
};

/**
 * Bridge so non-React code (the API client) can fetch the current Clerk session
 * token. The Clerk auth adapter registers the getter on mount.
 */
let tokenGetter: (() => Promise<string | null>) | null = null;
export function setSessionTokenGetter(fn: (() => Promise<string | null>) | null) {
  tokenGetter = fn;
}
export async function getSessionToken(): Promise<string | null> {
  return tokenGetter ? await tokenGetter() : null;
}
