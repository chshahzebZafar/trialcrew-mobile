/**
 * Auth context — app-wide shape consumed via `useAuth()`. It's fed by ONE of two
 * providers chosen in the root layout:
 *   - ClerkAuthProvider (src/lib/clerkAuth.tsx) when EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is set
 *   - StubAuthProvider (below) otherwise
 *
 * The stub store (persisted, accepts any credentials) is also exported via `authStub`
 * for the stub sign-in/up screens and the API client's no-Clerk token fallback.
 */
import { createContext, useContext, useSyncExternalStore } from "react";
import { readJSON, remove, writeJSON, StorageKeys } from "./storage";

export interface AuthUser {
  name: string;
  email: string;
}

export interface AuthValue {
  hydrated: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  signOut: () => void | Promise<void>;
}

export const AuthContext = createContext<AuthValue>({
  hydrated: false,
  isSignedIn: false,
  user: null,
  signOut: () => {},
});

/** The app-wide auth hook. */
export const useAuth = () => useContext(AuthContext);

// ─── Stub store (no-Clerk fallback) ───────────────────────────────────────────

interface StubSession {
  userId: string;
  token: string;
  email: string;
  name: string;
}
interface StubState {
  user: StubSession | null;
  hydrated: boolean;
}

let state: StubState = { user: null, hydrated: false };
const listeners = new Set<() => void>();
function setState(next: Partial<StubState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

async function hydrate() {
  const user = await readJSON<StubSession>(StorageKeys.session);
  setState({ user, hydrated: true });
}
void hydrate();

function makeUser(email: string, name?: string): StubSession {
  return {
    userId: "tester_self",
    token: "stub-token",
    email: email.trim(),
    name: name?.trim() || email.split("@")[0] || "Tester",
  };
}
async function persist(user: StubSession | null) {
  if (user) await writeJSON(StorageKeys.session, user);
  else await remove(StorageKeys.session);
}

export const authStub = {
  async signIn(email: string, _password: string) {
    const user = makeUser(email);
    setState({ user });
    await persist(user);
  },
  async signUp(params: { name: string; email: string; password: string }) {
    const user = makeUser(params.email, params.name);
    setState({ user });
    await persist(user);
  },
  async continueAsTester() {
    const user = makeUser("sam.rivera@example.com", "Sam Rivera");
    setState({ user });
    await persist(user);
  },
  async signOut() {
    setState({ user: null });
    await persist(null);
  },
  getToken() {
    return state.user?.token ?? null;
  },
};

/** Subscribe to the stub store and project it into the shared AuthValue. */
export function useStubAuthValue(): AuthValue {
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
    isSignedIn: snapshot.user !== null,
    user: snapshot.user ? { name: snapshot.user.name, email: snapshot.user.email } : null,
    signOut: authStub.signOut,
  };
}
