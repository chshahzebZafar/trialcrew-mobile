/**
 * Best-effort sync after a successful sign-in/up: register the device push token and
 * send it to the backend, and mark the user's roles. No-op against the mock; hits the
 * real backend when EXPO_PUBLIC_USE_BACKEND=true. Never throws (auth must not break).
 */
import { api } from "@/api/client";
import { registerPushToken } from "./push";

export async function syncAfterSignIn(): Promise<void> {
  try {
    const token = await registerPushToken();
    if (token) await api.setPushToken(token);
  } catch {
    // ignore — push is non-critical
  }
  try {
    // The TrialCrew user can act as both a tester and a founder.
    await api.setRole(true, true);
  } catch {
    // ignore
  }
}
