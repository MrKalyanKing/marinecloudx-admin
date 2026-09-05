/**
 * The admin app's single entry point to the backend API.
 *
 * Two variants:
 *   - `api`        — browser calls from client components. Sends the session
 *                    cookie (`withCredentials`).
 *   - `serverApi(cookie)` — server components / server actions. Forwards the
 *                    incoming request's `Cookie` header so the API sees the
 *                    same identity the page is rendering for.
 *
 * Nothing else in the app calls `fetch` directly.
 */

import { createApiClient } from "@/contracts";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const api = createApiClient({
  baseUrl,
  withCredentials: true,
  timeoutMs: 15_000,
});

export function serverApi(cookie: string) {
  return createApiClient({ baseUrl, cookie, timeoutMs: 15_000 });
}
