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
