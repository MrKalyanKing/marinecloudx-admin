/**
 * Admin UI primitives.
 *
 * A deliberately small set — enough for consistent tables, forms and states,
 * not a design system. Teal is the accent; everything else is neutral so the
 * interface stays scannable during daily operational use.
 *
 * These are server-safe (no hooks, no event handlers) so they can be used
 * directly in server components.
 */

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Headline number for the dashboard. Values always come from the database. */
export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "positive" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-slate-900",
    positive: "text-teal-700",
    warning: "text-amber-700",
    danger: "text-red-700",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                      */
/* -------------------------------------------------------------------------- */

export type BadgeTone = "neutral" | "teal" | "green" | "amber" | "red" | "blue" | "slate";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  slate: "bg-slate-800 text-white ring-slate-800",
  teal: "bg-teal-50 text-teal-800 ring-teal-200",
  green: "bg-green-50 text-green-800 ring-green-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-800 ring-red-200",
  blue: "bg-blue-50 text-blue-800 ring-blue-200",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-teal-700 text-white hover:bg-teal-800 disabled:bg-teal-700/60",
  secondary:
    "bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-60",
  ghost: "text-slate-700 hover:bg-slate-100 disabled:opacity-60",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/60",
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 " +
  "disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], className)} {...props} />;
}

/* -------------------------------------------------------------------------- */
/* Form controls                                                               */
/* -------------------------------------------------------------------------- */

const CONTROL_BASE =
  "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 " +
  "placeholder:text-slate-400 focus:border-teal-600 focus:outline-2 focus:outline-offset-0 " +
  "focus:outline-teal-600 disabled:bg-slate-50 disabled:text-slate-500";

/**
 * Every control is wrapped in a Field so it always has a real <label>. The
 * error is tied to the input with aria-describedby and aria-invalid.
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-red-600">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL_BASE, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL_BASE, "min-h-20", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(CONTROL_BASE, className)} {...props}>
      {children}
    </select>
  );
}

/* -------------------------------------------------------------------------- */
/* Tables                                                                      */
/* -------------------------------------------------------------------------- */

/** Wrapper providing the horizontal scroll tables need on narrow screens. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[48rem] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <td className={cn("border-b border-slate-100 px-3 py-2 align-middle text-slate-700", className)}>
      {children}
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/* States                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Empty state. Never renders placeholder rows — an empty table stays visibly
 * empty rather than being padded with invented records.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description ? <p className="max-w-md text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/**
 * Error state built from the API's own error envelope.
 *
 * Shows the API's user-facing message only. Stack traces and Prisma detail are
 * never sent to the browser in the first place.
 */
export function ErrorState({
  code,
  message,
  action,
}: {
  code?: string;
  message: string;
  action?: ReactNode;
}) {
  const friendly: Record<string, string> = {
    UNAUTHORIZED: "Your session has expired. Sign in again to continue.",
    FORBIDDEN: "Your role does not have access to this data.",
    NOT_FOUND: "That record could not be found.",
    VALIDATION_ERROR: message,
    INTERNAL_ERROR: message,
  };

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
    >
      <p className="text-sm font-medium text-red-900">Could not load this data</p>
      <p className="text-sm text-red-800">{(code && friendly[code]) || message}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-slate-200", className)} />;
}

/** Row-shaped skeleton so a loading table keeps the final layout's height. */
export function TableSkeleton({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-3 py-3">
          {Array.from({ length: columns }, (_, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn("h-4", columnIndex === 0 ? "w-48" : "w-24")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
