import { type ReactNode, useEffect } from "react";
import {
  ClerkProvider,
  useAuth as useClerkAuth,
  useUser,
} from "@clerk/clerk-expo";
import { AuthContext, useStubAuthValue, type AuthValue } from "./auth";
import {
  CLERK_ENABLED,
  CLERK_PUBLISHABLE_KEY,
  setSessionTokenGetter,
  tokenCache,
} from "./clerk";

/** No-Clerk path: project the persisted stub store into the shared context. */
function StubAuthProvider({ children }: { children: ReactNode }) {
  const value = useStubAuthValue();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Clerk path: map Clerk's hooks into the shared context + wire the token bridge. */
function ClerkAdapter({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, signOut, getToken } = useClerkAuth();
  const { user } = useUser();

  useEffect(() => {
    setSessionTokenGetter(() => getToken());
    return () => setSessionTokenGetter(null);
  }, [getToken]);

  const value: AuthValue = {
    hydrated: isLoaded,
    isSignedIn: !!isSignedIn,
    user: user
      ? {
          name:
            user.fullName ??
            (user.unsafeMetadata?.fullName as string | undefined) ??
            user.firstName ??
            "Tester",
          email: user.primaryEmailAddress?.emailAddress ?? "",
        }
      : null,
    signOut: () => signOut(),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ClerkAuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkAdapter>{children}</ClerkAdapter>
    </ClerkProvider>
  );
}

/** Choose the auth provider by env. */
export function AuthProviders({ children }: { children: ReactNode }) {
  return CLERK_ENABLED ? (
    <ClerkAuthProvider>{children}</ClerkAuthProvider>
  ) : (
    <StubAuthProvider>{children}</StubAuthProvider>
  );
}
