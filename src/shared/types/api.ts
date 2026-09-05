/**
 * Public API contract shared by every route handler.
 *
 * These types describe what leaves the server. They deliberately do not import
 * Prisma model types — the wire format is a decision of the API layer, not a
 * mirror of the database.
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
