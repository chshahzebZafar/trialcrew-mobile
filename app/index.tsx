import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useOnboarding } from "@/lib/onboarding";

/**
 * Entry point. Stores are already hydrated by the time the root layout renders
 * this (it gates on hydration), so we can route directly with no flash. The
 * root layout's gate stays as a safety net for later state changes.
 */
export default function Index() {
  const { isSignedIn } = useAuth();
  const { hasOnboarded } = useOnboarding();

  if (!hasOnboarded) return <Redirect href="/onboarding" />;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  return <Redirect href="/(tabs)" />;
}
