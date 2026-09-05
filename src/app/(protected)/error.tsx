"use client";

/**
 * Admin error boundary.
 *
 * Next.js gives client error boundaries only a digest in production — the real
 * message and stack stay on the server. This shows a recovery affordance rather
 * than any internal detail.
 */

import { useEffect } from "react";

import { Button } from "@/shared/components/primitives";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side logging already captured the cause; this records the
    // client-side occurrence for debugging.
    console.error("Admin route error", error.digest ?? error.message);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto max-w-lg rounded-lg border border-red-200 bg-red-50 px-5 py-6"
    >
      <h1 className="text-base font-semibold text-red-900">Something went wrong</h1>
      <p className="mt-1 text-sm text-red-800">
        This screen could not be loaded. If it keeps happening, check that the database is
        configured and reachable.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-red-700">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      ) : null}
      <div className="mt-4">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
