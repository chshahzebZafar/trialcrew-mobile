/**
 * Backend HTTP foundation. The mock client (`src/api/mock/client.ts`) is the current
 * data source; when the Fastify backend is ready, implement a real client with the same
 * shape (see `Api` in `client.ts`) using `http()` below and point `client.ts` at it.
 *
 * Base URL comes from the `EXPO_PUBLIC_API_URL` env var (inlined by Expo at build).
 */
import { authStub } from "@/lib/auth";
import { CLERK_ENABLED, getSessionToken } from "@/lib/clerk";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

/** Whether the app talks to the real backend (vs the in-memory mock). */
export const USE_BACKEND = process.env.EXPO_PUBLIC_USE_BACKEND === "true";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API ${status}: ${body}`);
    this.name = "ApiError";
  }
}

/** Typed fetch helper — attaches the auth (Clerk) token and JSON-encodes the body. */
export async function http<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & { json?: unknown },
): Promise<T> {
  const token = CLERK_ENABLED ? await getSessionToken() : authStub.getToken();
  // DEV ONLY: print the bearer token whenever it changes (Clerk rotates it ~every 60s), so the
  // latest console line is always a valid token to copy for curl/Postman. Never logs in prod.
  if (__DEV__ && token && (globalThis as any).__lastTok !== token) {
    (globalThis as any).__lastTok = token;
    console.log("\n🔑 [dev] fresh API token (valid ~60s — copy & use quickly):\n" + token + "\n");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: init?.method ?? (init?.json !== undefined ? "POST" : "GET"),
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : undefined,
  });

  if (!res.ok) throw new ApiError(res.status, await res.text().catch(() => ""));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Human-readable message from an ApiError (parses the JSON body) or any error. */
export function apiErrorMessage(e: unknown, fallback = "Something went wrong. Please try again."): string {
  if (e instanceof ApiError) {
    try {
      return (JSON.parse(e.body) as { error?: { message?: string } })?.error?.message ?? fallback;
    } catch {
      return fallback;
    }
  }
  return e instanceof Error && e.message ? e.message : fallback;
}
