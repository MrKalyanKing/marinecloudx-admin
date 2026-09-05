/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source of truth: packages/contracts/client.ts
 * Regenerate:      npm run sync:contracts   (from the repo root)
 */

/**
 * Framework-agnostic API client.
 *
 * The single way `apps/frontend` and `apps/admin` talk to the NestJS backend.
 * No `fetch()` calls anywhere else in either app.
 *
 * Responsibilities (carried over from the legacy `adminApiGet` plus what a
 * real client needs):
 *   - base URL joining
 *   - JSON body + `Content-Type: application/json` (a form-shaped cross-site
 *     POST cannot then reach a handler — see docs/security.md §13)
 *   - auth: bearer token or forwarded cookie
 *   - per-request `x-request-id`
 *   - timeout via AbortController
 *   - bounded retry with backoff on network failure / 429 / 5xx
 *   - response normalization: every result is an `ApiResponse<T>`, never a throw
 *     for an HTTP error. Only misuse (no base URL) throws.
 *
 * Depends only on web-standard globals (`fetch`, `AbortController`, `crypto`),
 * so it runs in the browser, in a Next.js server component, and in Node ≥ 18.
 */

import type { ApiErrorCode, ApiResponse } from "./envelope";

export interface ApiClientOptions {
  /** e.g. `https://api.example.com` or `http://localhost:3001`. Required. */
  baseUrl: string;
  /** Returns a bearer token to send as `Authorization: Bearer <token>`. */
  getToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /**
   * Raw `Cookie` header value to forward (server-side rendering: pass the
   * incoming request's cookie so the API sees the same identity).
   */
  cookie?: string;
  /** Send browser credentials (cookies) with each request. Default `false`. */
  withCredentials?: boolean;
  /** Extra headers applied to every request. */
  headers?: Record<string, string>;
  /** Per-request timeout in ms. Default 15000. `0` disables. */
  timeoutMs?: number;
  /** Retry attempts for network errors / 429 / 5xx on safe methods. Default 2. */
  retries?: number;
  /** Injected fetch (tests, or a Next.js `fetch` with cache options). */
  fetch?: typeof fetch;
  /**
   * Merged into every request's init — the place to pass Next.js
   * `{ next: { tags, revalidate } }` or `cache`.
   */
  requestInit?: RequestInit & Record<string, unknown>;
}

export interface RequestOptions {
  /** Query string params; `undefined`/`""` entries are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Per-call header overrides. */
  headers?: Record<string, string>;
  /** Per-call AbortSignal (composed with the timeout signal). */
  signal?: AbortSignal;
  /** Per-call override of the client default. */
  timeoutMs?: number;
  /** Per-call fetch init merge (e.g. Next.js cache tags for one call). */
  requestInit?: RequestInit & Record<string, unknown>;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: RequestOptions["query"],
): string {
  const base = baseUrl.replace(/\/+$/, "");
  const rel = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${rel}`;
  if (!query) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

function normalizeError(
  code: ApiErrorCode,
  message: string,
): Extract<ApiResponse<never>, { success: false }> {
  return { success: false, error: { code, message } };
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof (value as { success: unknown }).success === "boolean"
  );
}

const STATUS_TO_CODE: Record<number, ApiErrorCode> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ApiClient {
  private readonly opts: Required<Pick<ApiClientOptions, "baseUrl" | "timeoutMs" | "retries">> &
    ApiClientOptions;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions) {
    if (!options.baseUrl) {
      throw new Error("ApiClient: `baseUrl` is required.");
    }
    this.opts = {
      timeoutMs: 15_000,
      retries: 2,
      ...options,
    };
    const f = options.fetch ?? globalThis.fetch;
    if (!f) {
      throw new Error("ApiClient: no global `fetch` available; pass `options.fetch`.");
    }
    this.fetchImpl = f.bind(globalThis);
  }

  get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path, undefined, options);
  }

  /** POST a `FormData` body (media upload) — no JSON `Content-Type` is set. */
  upload<T>(path: string, form: FormData, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, form, options, true);
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    options: RequestOptions = {},
    multipart = false,
  ): Promise<ApiResponse<T>> {
    const url = buildUrl(this.opts.baseUrl, path, options.query);
    const maxAttempts = SAFE_METHODS.has(method) ? this.opts.retries + 1 : 1;

    let lastError: Extract<ApiResponse<never>, { success: false }> = normalizeError(
      "INTERNAL_ERROR",
      "The request could not be completed.",
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const timeoutMs = options.timeoutMs ?? this.opts.timeoutMs;
      const controller = new AbortController();
      const timer =
        timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
      if (options.signal) {
        if (options.signal.aborted) controller.abort();
        else options.signal.addEventListener("abort", () => controller.abort(), { once: true });
      }

      const headers: Record<string, string> = {
        accept: "application/json",
        "x-request-id": newRequestId(),
        ...this.opts.headers,
        ...options.headers,
      };
      if (!multipart && body !== undefined) headers["content-type"] = "application/json";
      if (this.opts.cookie) headers["cookie"] = this.opts.cookie;

      const token = this.opts.getToken ? await this.opts.getToken() : undefined;
      if (token) headers["authorization"] = `Bearer ${token}`;

      const init: RequestInit & Record<string, unknown> = {
        method,
        headers,
        signal: controller.signal,
        ...(this.opts.withCredentials ? { credentials: "include" as const } : {}),
        ...this.opts.requestInit,
        ...options.requestInit,
      };
      if (body !== undefined) {
        init.body = multipart ? (body as FormData) : JSON.stringify(body);
      }

      try {
        const res = await this.fetchImpl(url, init);
        const text = await res.text();
        const parsed: unknown = text ? safeJson(text) : null;

        if (isApiResponse(parsed)) {
          if (!parsed.success && res.status >= 500 && attempt < maxAttempts) {
            lastError = parsed as typeof lastError;
            await delay(backoff(attempt));
            continue;
          }
          return parsed as ApiResponse<T>;
        }

        // Backend did not return the envelope (proxy error, gateway, HTML 502…).
        const code = STATUS_TO_CODE[res.status] ?? "INTERNAL_ERROR";
        const message = res.ok
          ? "The API returned an unexpected response shape."
          : `Request failed with status ${res.status}.`;
        if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
          lastError = normalizeError(code, message);
          await delay(backoff(attempt));
          continue;
        }
        return normalizeError(code, message) as ApiResponse<T>;
      } catch (err) {
        const aborted = err instanceof Error && err.name === "AbortError";
        lastError = normalizeError(
          aborted ? "INTERNAL_ERROR" : "INTERNAL_ERROR",
          aborted
            ? "The request timed out."
            : "Could not reach the API. Check the network and that the backend is running.",
        );
        if (attempt < maxAttempts) {
          await delay(backoff(attempt));
          continue;
        }
        return lastError as ApiResponse<T>;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    return lastError as ApiResponse<T>;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Exponential backoff with jitter: ~200ms, ~500ms, ~1.1s … capped at 5s. */
function backoff(attempt: number): number {
  const base = Math.min(5_000, 200 * 2 ** (attempt - 1));
  return base + Math.random() * 100;
}

/** Convenience factory. */
export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}
