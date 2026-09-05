/**
 * Centralised error model.
 *
 * Every error the API deliberately produces is an `AppError`. Anything else
 * that reaches the route boundary is treated as unexpected and reported to the
 * client as a generic INTERNAL_ERROR — the real detail is logged server-side
 * and never serialised into the response.
 */

import type { ApiErrorCode, ApiFieldError } from "@/shared/types/api";

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly details?: ApiFieldError[];
  /** Seconds until the caller may retry. Emitted as the Retry-After header. */
  readonly retryAfterSeconds?: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: number,
    details?: ApiFieldError[],
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;

    Error.captureStackTrace?.(this, new.target);
  }
}

/** 400 — the request body or query failed schema validation. */
export class ValidationError extends AppError {
  constructor(message = "Request validation failed", details?: ApiFieldError[]) {
    super("VALIDATION_ERROR", message, 400, details);
  }
}

/** 404 — the addressed resource, or a resource it references, does not exist. */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
  }
}

/** 409 — the request is valid but conflicts with current state. */
export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super("CONFLICT", message, 409);
  }
}

/** 401 — no valid identity. Reserved for when authentication is introduced. */
export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
  }
}

/** 403 — identity is known but not permitted. Reserved for authorization. */
export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super("FORBIDDEN", message, 403);
  }
}

/**
 * 429 — too many requests from this caller.
 *
 * The message stays vague on purpose: telling a spammer the exact window and
 * quota just tells them how slowly to retry.
 */
export class RateLimitError extends AppError {
  constructor(retryAfterSeconds: number, message = "Too many requests. Please try again later.") {
    super("RATE_LIMITED", message, 429, undefined, retryAfterSeconds);
  }
}

/** 500 — the client-facing message is intentionally generic. */
export class InternalError extends AppError {
  constructor(message = "An unexpected error occurred") {
    super("INTERNAL_ERROR", message, 500);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
