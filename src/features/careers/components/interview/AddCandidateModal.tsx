"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { ApplicationSource, ApplicationStatus } from "@/contracts";
import { Button, Field, Input, Select } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Array<{ id: string; title: string }>;
  defaultJobId?: string;
  onCandidateAdded?: (applicationId: string) => void;
}

export function AddCandidateModal({
  isOpen,
  onClose,
  jobs,
  defaultJobId,
  onCandidateAdded,
}: AddCandidateModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [candidateName, setCandidateName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobId, setJobId] = useState(defaultJobId || (jobs[0]?.id ?? ""));
  const [applicationSource, setApplicationSource] = useState<ApplicationSource>(
    ApplicationSource.LINKEDIN,
  );
  const [status, setStatus] = useState<ApplicationStatus>(
    ApplicationStatus.SHORTLISTED,
  );
  const [notes, setNotes] = useState("");

  const { mutate, isPending, error } = useApiMutation<{ id: string }>();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (defaultJobId) {
      setJobId(defaultJobId);
    } else if (jobs.length > 0 && !jobId) {
      setJobId(jobs[0].id);
    }
  }, [defaultJobId, jobs, jobId]);

  if (!isOpen || !mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!candidateName.trim() || !email.trim() || !jobId) return;

    const res = await mutate("/api/admin/careers/candidates", {
      method: "POST",
      body: {
        candidateName: candidateName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        jobId,
        applicationSource,
        status,
        notes: notes.trim() || undefined,
      },
    });

    if (res && res.id) {
      onClose();
      if (onCandidateAdded) {
        onCandidateAdded(res.id);
      } else {
        router.push(`/careers/applications/${res.id}`);
        router.refresh();
      }
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative my-8 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Candidate</h2>
            <p className="text-xs text-slate-500">
              Directly add a candidate from LinkedIn, referral, or other sources without requiring a website application.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error.message || "Failed to add candidate. Please check the inputs."}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <Field label="Full Name *" htmlFor="candidateName">
            <Input
              id="candidateName"
              placeholder="e.g. Priya Sharma"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Email Address *" htmlFor="candidateEmail">
              <Input
                id="candidateEmail"
                type="email"
                placeholder="priya@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="Phone (Optional)" htmlFor="candidatePhone">
              <Input
                id="candidatePhone"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Position Applied For *" htmlFor="candidateJob">
            <Select
              id="candidateJob"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              required
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Candidate Source *" htmlFor="candidateSource">
              <Select
                id="candidateSource"
                value={applicationSource}
                onChange={(e) => setApplicationSource(e.target.value as ApplicationSource)}
              >
                <option value={ApplicationSource.LINKEDIN}>LinkedIn</option>
                <option value={ApplicationSource.REFERRAL}>Referral</option>
                <option value={ApplicationSource.MANUAL}>Manual Entry</option>
                <option value={ApplicationSource.CAREERS_PAGE}>Careers Page</option>
                <option value={ApplicationSource.OTHER}>Other</option>
              </Select>
            </Field>

            <Field label="Initial Status" htmlFor="candidateStatus">
              <Select
                id="candidateStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              >
                <option value={ApplicationStatus.SHORTLISTED}>Shortlisted (Ready for Interview)</option>
                <option value={ApplicationStatus.NEW}>Submitted / New</option>
                <option value={ApplicationStatus.UNDER_REVIEW}>Under Review</option>
              </Select>
            </Field>
          </div>

          <Field label="Notes / Profile Summary (Optional)" htmlFor="candidateNotes">
            <textarea
              id="candidateNotes"
              rows={3}
              placeholder="e.g. Applied via LinkedIn posting, 2 years experience in digital marketing."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </Field>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending || !candidateName.trim() || !email.trim() || !jobId}
            >
              {isPending ? "Adding Candidate…" : "Add Candidate & Open"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
