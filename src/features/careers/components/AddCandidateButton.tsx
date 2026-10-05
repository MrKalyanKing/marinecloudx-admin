"use client";

import { useState } from "react";
import { Button } from "@/shared/components/primitives";
import { AddCandidateModal } from "./interview/AddCandidateModal";

interface AddCandidateButtonProps {
  jobs: Array<{ id: string; title: string }>;
  defaultJobId?: string;
}

export function AddCandidateButton({ jobs, defaultJobId }: AddCandidateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="primary"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5"
      >
        <span>+</span> Add Candidate
      </Button>

      <AddCandidateModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        jobs={jobs}
        defaultJobId={defaultJobId}
      />
    </>
  );
}
