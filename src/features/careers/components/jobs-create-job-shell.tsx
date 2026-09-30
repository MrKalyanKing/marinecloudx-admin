"use client";

import { useState, type ReactNode } from "react";

import { JobFormModal } from "@/features/careers/components/job-form-dialog";
import { Button } from "@/shared/components/primitives";

/**
 * Owns a single Create-job modal for the Jobs page.
 * Header and empty-state buttons both call `open()` so only one overlay exists.
 */
export function JobsCreateJobShell({
  children,
}: {
  children: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {children(() => setOpen(true))}
      {open ? <JobFormModal mode="create" onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function CreateJobButton({ onOpen }: { onOpen: () => void }) {
  return (
    <Button type="button" variant="primary" onClick={onOpen}>
      Create job
    </Button>
  );
}
