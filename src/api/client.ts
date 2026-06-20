/**
 * API transport boundary. Screens/hooks only ever import `api` from here.
 *
 * Selects the data source from env:
 *   - EXPO_PUBLIC_USE_BACKEND="true"  → real HTTP client (../backend, via realClient.ts)
 *   - otherwise (default)             → in-memory mock (mock/client.ts)
 *
 * `Api` is the shared contract type both clients satisfy.
 */
import { mockApi } from "./mock/client";

export type Api = typeof mockApi;

const useBackend = process.env.EXPO_PUBLIC_USE_BACKEND === "true";

// Lazy-require the real client only when enabled, so the mock build never pulls it in.
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const api: Api = useBackend
  ? (require("./realClient").realApi as Api)
  : mockApi;
