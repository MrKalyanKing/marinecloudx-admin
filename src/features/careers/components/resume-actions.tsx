"use client";

import { useState } from "react";

import { Button } from "@/shared/components/primitives";
import type { ResumeUrlResponse } from "@/features/careers/types/careers";

export function ResumeActions({
  applicationId,
  fileName,
  mimeType,
  sizeLabel,
  hasResume,
}: {
  applicationId: string;
  fileName: string | null;
  mimeType?: string | null;
  sizeLabel?: string;
  hasResume: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAndOpen(disposition: "preview" | "download") {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const response = await fetch(
        `${API_URL}/admin/careers/applications/${encodeURIComponent(applicationId)}/resume-url?disposition=${disposition}`,
        { credentials: "include" },
      );
      const payload = (await response.json()) as {
        success: boolean;
        data?: ResumeUrlResponse;
        error?: { message: string };
      };
      if (!response.ok || !payload.success || !payload.data?.url) {
        setError(payload.error?.message ?? "Could not open resume. The link may have expired — try again.");
        return;
      }
      window.open(payload.data.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  if (!hasResume) {
    return <p className="text-sm text-slate-500">No resume attached.</p>;
  }

  const kind = mimeType?.includes("pdf") ? "PDF" : "File";

  return (
    <div className="flex flex-col gap-2">
      {fileName ? (
        <div>
          <p className="text-sm font-medium text-slate-900">{fileName}</p>
          <p className="text-xs text-slate-500">
            {kind}
            {sizeLabel ? ` · ${sizeLabel}` : ""}
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => void fetchAndOpen("preview")}
        >
          {pending ? "Opening…" : "Preview Resume"}
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={pending}
          onClick={() => void fetchAndOpen("download")}
        >
          Download Resume
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
