/**
 * Tiny typed wrapper over AsyncStorage. Keeps key names in one place and swallows
 * read/parse errors (returns null) so callers don't each repeat try/catch.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export const StorageKeys = {
  onboarded: "tc.onboarded",
  session: "tc.session",
} as const;

export async function readJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort; ignore write failures in the stub
  }
}

export async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}
