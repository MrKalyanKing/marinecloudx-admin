"use client";

import { ApplicationStatus } from "@/contracts";
import { Button } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";

export function RejectStatusButton({ applicationId }: { applicationId: string }) {
  const { mutate, isPending, error } = useApiMutation();

  async function reject() {
    if (!window.confirm("Reject this candidate? They will be marked as Rejected.")) return;
    await mutate(`/api/admin/careers/applications/${applicationId}/status`, {
      method: "PATCH",
      body: { status: ApplicationStatus.REJECTED },
    });
  }

  return (
    <div>
      <Button type="button" variant="danger" disabled={isPending} onClick={() => void reject()}>
        {isPending ? "Rejecting…" : "Reject"}
      </Button>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
