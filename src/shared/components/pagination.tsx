import Link from "next/link";

import { cn } from "@/shared/components/primitives";
import type { ApiPagination } from "@/shared/types/api";

/**
 * Server-rendered pagination driven entirely by the API's metadata.
 *
 * Links rather than buttons, so pages are shareable, bookmarkable and work
 * without JavaScript. Nothing is paginated client-side — the browser never
 * holds more than one page of rows.
 */
export function Pagination({
  pagination,
  basePath,
  params = {},
}: {
  pagination: ApiPagination;
  basePath: string;
  /** Current filters, preserved across page changes. */
  params?: Record<string, string | undefined>;
}) {
  const { page, pageSize, total, totalPages } = pagination;

  const buildHref = (targetPage: number, targetPageSize = pageSize) => {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }

    search.set("page", String(targetPage));
    search.set("pageSize", String(targetPageSize));

    return `${basePath}?${search.toString()}`;
  };

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  const linkClass = (enabled: boolean) =>
    cn(
      "rounded-md px-2.5 py-1 text-sm ring-1 ring-inset transition-colors",
      enabled
        ? "bg-white text-slate-800 ring-slate-300 hover:bg-slate-50"
        : "pointer-events-none bg-slate-50 text-slate-400 ring-slate-200",
    );

  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3"
    >
      <p className="text-xs text-slate-600">
        {total === 0 ? (
          "No results"
        ) : (
          <>
            Showing <span className="font-medium tabular-nums">{firstRow}</span>–
            <span className="font-medium tabular-nums">{lastRow}</span> of{" "}
            <span className="font-medium tabular-nums">{total}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-600">Per page</span>
          {[20, 50, 100].map((size) => (
            <Link
              key={size}
              href={buildHref(1, size)}
              aria-current={size === pageSize ? "true" : undefined}
              className={cn(
                "rounded px-1.5 py-0.5 text-xs ring-1 ring-inset transition-colors",
                size === pageSize
                  ? "bg-teal-700 text-white ring-teal-700"
                  : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50",
              )}
            >
              {size}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={hasPrevious ? buildHref(page - 1) : "#"}
            aria-disabled={!hasPrevious}
            tabIndex={hasPrevious ? undefined : -1}
            className={linkClass(hasPrevious)}
          >
            Previous
          </Link>
          <span className="text-xs tabular-nums text-slate-600">
            Page {page} of {Math.max(totalPages, 1)}
          </span>
          <Link
            href={hasNext ? buildHref(page + 1) : "#"}
            aria-disabled={!hasNext}
            tabIndex={hasNext ? undefined : -1}
            className={linkClass(hasNext)}
          >
            Next
          </Link>
        </div>
      </div>
    </nav>
  );
}
