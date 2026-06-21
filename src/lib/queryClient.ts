import { MutationCache, QueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { apiErrorMessage } from "@/api/config";

export const queryClient = new QueryClient({
  // Global safety net: any mutation that doesn't handle its own error surfaces a clear alert
  // instead of failing silently. Opt out per-mutation with `meta: { localError: true }`.
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if ((mutation.options.meta as { localError?: boolean } | undefined)?.localError) return;
      Alert.alert("Something went wrong", apiErrorMessage(error));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      // Refetch when the app returns to the foreground (wired via AppState in app/_layout.tsx)
      // so changes made on another device show up without a manual reload.
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
