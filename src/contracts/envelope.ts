/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source of truth: packages/contracts/envelope.ts
 * Regenerate:      npm run sync:contracts   (from the repo root)
 */

/**
 * The API envelope — the single shape every backend response takes, and the
 * only shape the frontend and admin apps are allowed to expect.
 *
 * Ported verbatim from the pre-monorepo `src/shared/types/api.ts` so existing
 * clients keep working unchanged. These types describe the wire format only —
 * they never mirror a database entity.
 */

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

/** One failed field, safe to show a user. Never contains internal detail. */
export interface ApiFieldError {
  path: string;
  message: string;
}

export interface ApiPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
  pagination?: ApiPagination;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    /** Present only for VALIDATION_ERROR. */
    details?: ApiFieldError[];
  };
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

/**
 * A paginated collection response: `data` is the page of rows, `pagination`
 * carries the counts. Equivalent to `ApiSuccessResponse<T[]>` with `pagination`
 * required rather than optional.
 */
export interface PaginatedResponse<TItem> {
  success: true;
  data: TItem[];
  pagination: ApiPagination;
}
