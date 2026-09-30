"use client";

import { JobStatus } from "@/contracts";
import { Button, Select } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";

export function JobStatusActions({
  jobId,
  currentStatus,
}: {
  jobId: string;
  currentStatus: JobStatus;
}) {
  const { mutate, isPending, error } = useApiMutation();

  async function setStatus(status: JobStatus) {
    await mutate(`/api/admin/careers/jobs/${jobId}`, {
      method: "PATCH",
      body: { status },
    });
  }

  async function archiveOrDelete() {
    const ok = window.confirm(
      "Archive or delete this job? Jobs with applications are archived instead of deleted.",
    );
    if (!ok) return;
    await mutate(`/api/admin/careers/jobs/${jobId}`, { method: "DELETE" });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Job status"
        value={currentStatus}
        disabled={isPending}
        className="w-auto py-1 text-xs"
        onChange={(e) => void setStatus(e.target.value as JobStatus)}
      >
        {Object.values(JobStatus).map((s) => (
          <option key={s} value={s}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </option>
        ))}
      </Select>
      <Button type="button" variant="ghost" disabled={isPending} onClick={() => void archiveOrDelete()}>
        Delete
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
