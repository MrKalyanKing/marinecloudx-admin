"use client";

/**
 * Shared client-side mutation helper.
 *
 * Client components talk to the same protected API as the server does. On
 * success it calls `router.refresh()`, which re-runs the server components for
 * the current route — the affected data updates without a full page reload and
 * without a second client-side cache to keep in sync.
 *
 * Concurrent submissions are blocked while one is in flight, so a double click
 * cannot create two leads.
 */

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import type { ApiFieldError } from "@/shared/types/api";

/**
 * Browser → NestJS backend. Call sites pass legacy `/api/admin/...` paths; the
 * `/api` prefix is dropped and the rest resolved against the backend origin.
 * `credentials: "include"` sends the session cookie (same-site: localhost, or
 * `admin.` / `api.` subdomains of one registrable domain).
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function backendUrl(path: string): string {
  const rel = path.replace(/^\/api(?=\/)/, "");
  return `${API_URL}${rel.startsWith("/") ? rel : `/${rel}`}`;
}

export interface MutationError {
  message: string;
  /** Field-level detail from a VALIDATION_ERROR, keyed by field path. */
  fields?: Record<string, string>;
}

function toFieldMap(details: ApiFieldError[] | undefined): Record<string, string> | undefined {
  if (!details?.length) return undefined;

  return Object.fromEntries(details.map((detail) => [detail.path, detail.message]));
}

export function useApiMutation<TResult>() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<MutationError | null>(null);

  const reset = useCallback(() => setError(null), []);

  const mutate = useCallback(
    async (
      path: string,
      options: { method: "POST" | "PATCH" | "DELETE"; body?: unknown },
    ): Promise<TResult | null> => {
      if (isPending) return null;

      setIsPending(true);
      setError(null);

      try {
        const response = await fetch(backendUrl(path), {
          method: options.method,
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
        });

        const payload: unknown = await response.json().catch(() => null);

        const envelope = payload as
          | {
              success: boolean;
              data?: TResult;
              error?: { code: string; message: string; details?: ApiFieldError[] };
            }
          | null;

        if (!response.ok || !envelope?.success) {
          setError({
            message:
              envelope?.error?.message ??
              (response.status === 401
                ? "Your session has expired. Sign in again."
                : "Something went wrong. Please try again."),
            fields: toFieldMap(envelope?.error?.details),
          });

          return null;
        }

        router.refresh();

        return (envelope.data ?? null) as TResult | null;
      } catch {
        setError({ message: "Could not reach the server. Check your connection." });

        return null;
      } finally {
        setIsPending(false);
      }
    },
    [isPending, router],
  );

  return { mutate, isPending, error, reset };
}
