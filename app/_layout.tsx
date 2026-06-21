import "../global.css";

import { useEffect } from "react";
import { AppState, View, type AppStateStatus } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import { useFonts } from "expo-font";

import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { AuthProviders } from "@/lib/authProviders";
import { useOnboarding } from "@/lib/onboarding";
import { useRoleStore } from "@/stores/roleStore";
import { RoleTransition } from "@/components/RoleTransition";
import { colors } from "@/theme/tokens";

/**
 * Gate the app: first launch → onboarding, then auth, then the tabs. Waits for the
 * persisted stores to hydrate before redirecting so we don't flash the wrong screen.
 */
function useProtectedRoute() {
  const { isSignedIn, hydrated: authReady } = useAuth();
  const { hasOnboarded, hydrated: onboardReady } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!authReady || !onboardReady) return;
    const group = segments[0];
    const inOnboarding = group === "onboarding";
    const inAuth = group === "(auth)";

    if (!hasOnboarded && !inOnboarding) {
      router.replace("/onboarding");
    } else if (hasOnboarded && !isSignedIn && !inAuth) {
      router.replace("/(auth)/sign-in");
    } else if (isSignedIn && (inAuth || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [authReady, onboardReady, hasOnboarded, isSignedIn, segments, router]);
}

function RootNavigator() {
  useProtectedRoute();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="cycle/[id]"
        options={{ headerShown: true, title: "Cycle", headerStyle: { backgroundColor: colors.porcelain }, headerTintColor: colors.ink, headerShadowVisible: false }}
      />
      <Stack.Screen
        name="submit-app"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="notifications"
        options={{ headerShown: true, title: "Notifications", headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerShadowVisible: false }}
      />
      <Stack.Screen name="edit-profile" options={{ headerShown: false, presentation: "modal" }} />
    </Stack>
  );
}

/** Auth-dependent gate — lives under AuthProviders so useAuth() reads the context. */
function Root() {
  const { hydrated: authReady } = useAuth();
  const { hydrated: onboardReady } = useOnboarding();
  const roleReady = useRoleStore((s) => s.hydrated);

  if (!authReady || !onboardReady || !roleReady) return null;

  return (
    <View style={{ flex: 1 }}>
      <RootNavigator />
      <RoleTransition />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  // Tell React Query the app is "focused" when it returns to the foreground → refetch stale data
  // (so changes from another device appear when you switch back to the app).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (status: AppStateStatus) => {
      focusManager.setFocused(status === "active");
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <AuthProviders>
          <Root />
        </AuthProviders>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
