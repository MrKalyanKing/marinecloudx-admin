"use client";

import { useEffect, useState } from "react";

import { ApplicationStatus } from "@/contracts";
import {
  APPLICATION_STATUSES,
  applicationStatusLabel,
} from "@/features/careers/components/display";
import { Select } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";

export function ApplicationStatusSelect({
  applicationId,
  currentStatus,
  label = "Status",
  hideLabel = false,
  compact = false,
  successMessage,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
  label?: string;
  hideLabel?: boolean;
  compact?: boolean;
  successMessage?: boolean;
}) {
  const { mutate, isPending, error } = useApiMutation();
  const [value, setValue] = useState(currentStatus);
  const [saved, setSaved] = useState(false);
  const controlId = `app-status-${applicationId}`;

  useEffect(() => {
    setValue(currentStatus);
  }, [currentStatus]);

  async function handleChange(next: string) {
    const previous = value;
    setValue(next as ApplicationStatus);
    setSaved(false);

    const result = await mutate(`/api/admin/careers/applications/${applicationId}/status`, {
      method: "PATCH",
      body: { status: next },
    });

    if (!result) {
      setValue(previous);
      return;
    }
    if (successMessage) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className={compact ? "" : "flex flex-col gap-1"}>
      <label
        htmlFor={controlId}
        className={hideLabel ? "sr-only" : "text-xs font-medium text-slate-700"}
      >
        {label}
      </label>
      <Select
        id={controlId}
        value={value}
        disabled={isPending}
        onChange={(event) => void handleChange(event.target.value)}
        className={compact ? "py-1 text-xs" : undefined}
      >
        {APPLICATION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {applicationStatusLabel(status)}
          </option>
        ))}
      </Select>
      {isPending ? <p className="mt-1 text-xs text-slate-500">Updating…</p> : null}
      {saved ? <p className="mt-1 text-xs text-teal-700">Status updated</p> : null}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
