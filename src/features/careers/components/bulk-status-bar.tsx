"use client";

import { useMemo, useState } from "react";

import { ApplicationStatus } from "@/contracts";
import { applicationStatusLabel } from "@/features/careers/components/display";
import { Button, Select } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";

const BULK_OPTIONS = [
  ApplicationStatus.UNDER_REVIEW,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.REJECTED,
] as const;

export function BulkStatusBar({
  selectedIds,
  onCleared,
}: {
  selectedIds: string[];
  onCleared: () => void;
}) {
  const { mutate, isPending, error } = useApiMutation<{ ok: boolean; updated: number }>();
  const [status, setStatus] = useState<string>(ApplicationStatus.UNDER_REVIEW);
  const [message, setMessage] = useState<string | null>(null);

  const count = selectedIds.length;
  const disabled = count === 0 || isPending;

  const label = useMemo(
    () => `${count} candidate${count === 1 ? "" : "s"} selected`,
    [count],
  );

  if (count === 0) return null;

  async function apply() {
    setMessage(null);
    const result = await mutate(`/api/admin/careers/applications/bulk-status`, {
      method: "POST",
      body: { ids: selectedIds, status },
    });
    if (result) {
      setMessage(`Updated ${result.updated} application${result.updated === 1 ? "" : "s"}.`);
      onCleared();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="bulk-status" className="sr-only">
          Change status
        </label>
        <Select
          id="bulk-status"
          value={status}
          disabled={isPending}
          onChange={(e) => setStatus(e.target.value)}
          className="w-auto min-w-40 py-1 text-xs"
        >
          {BULK_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {applicationStatusLabel(s)}
            </option>
          ))}
        </Select>
        <Button type="button" variant="secondary" disabled={disabled} onClick={() => void apply()}>
          {isPending ? "Updating…" : "Change Status"}
        </Button>
        <Button type="button" variant="ghost" disabled={isPending} onClick={onCleared}>
          Clear selection
        </Button>
      </div>
      {message ? <p className="text-xs text-teal-700">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
