import "server-only";

/**
 * Server-side client for the NestJS backend's admin API.
 *
 * Admin server components fetch through the real HTTP backend, so the UI goes
 * through the same authentication, authorization and validation as any other
 * client — one enforcement path. The incoming request's session cookie is
 * forwarded so the API sees the same identity the page is rendering for.
 *
 * Call sites pass legacy-style `/api/admin/...` paths; the leading `/api` is
 * stripped and the rest is resolved against `NEXT_PUBLIC_API_URL`.
 */

import { headers } from "next/headers";

import type { ApiErrorCode, ApiPagination } from "@/shared/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface AdminApiSuccess<TData> {
  ok: true;
  data: TData;
  pagination?: ApiPagination;
}

export interface AdminApiFailure {
  ok: false;
  code: ApiErrorCode;
  message: string;
  status: number;
}

export type AdminApiResult<TData> = AdminApiSuccess<TData> | AdminApiFailure;

/** `/api/admin/leads` → `http://backend/admin/leads`. */
export function backendUrl(path: string): string {
  const rel = path.replace(/^\/api(?=\/)/, "");
  return `${API_URL}${rel.startsWith("/") ? rel : `/${rel}`}`;
}

export async function adminApiGet<TData>(path: string): Promise<AdminApiResult<TData>> {
  try {
    const cookie = (await headers()).get("cookie") ?? "";

    const response = await fetch(backendUrl(path), {
      headers: { cookie, accept: "application/json" },
      cache: "no-store",
    });

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok || !body || typeof body !== "object" || !("success" in body)) {
      const error =
        body && typeof body === "object" && "error" in body
          ? (body.error as { code?: ApiErrorCode; message?: string })
          : undefined;
      return {
        ok: false,
        status: response.status,
        code: error?.code ?? "INTERNAL_ERROR",
        message: error?.message ?? "The request could not be completed.",
      };
    }

    const payload = body as {
      success: boolean;
      data: TData;
      pagination?: ApiPagination;
      error?: { code: ApiErrorCode; message: string };
    };

    if (!payload.success) {
      return {
        ok: false,
        status: response.status,
        code: payload.error?.code ?? "INTERNAL_ERROR",
        message: payload.error?.message ?? "The request could not be completed.",
      };
    }

    return { ok: true, data: payload.data, pagination: payload.pagination };
  } catch {
    return {
      ok: false,
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Could not reach the API. Check that the backend is running.",
    };
  }
}

/** Builds a query string, omitting empty values so blank filters are absent. */
export function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
