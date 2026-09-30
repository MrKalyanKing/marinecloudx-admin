"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { EmploymentType, JobStatus } from "@/contracts";
import {
  EMPLOYMENT_TYPES,
  JOB_STATUSES,
  employmentTypeLabel,
} from "@/features/careers/components/display";
import type { JobListItem } from "@/features/careers/types/careers";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";

type Mode = "create" | "edit";

/**
 * Job create/edit dialog.
 *
 * Overlay is portaled to `document.body` so liquid-glass ancestors
 * (`backdrop-filter` / `overflow: hidden`) cannot clip the full-page modal.
 */
export function JobFormDialog({
  mode,
  job,
  triggerLabel,
  triggerVariant,
}: {
  mode: Mode;
  job?: JobListItem;
  triggerLabel: string;
  triggerVariant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant ?? (mode === "create" ? "primary" : "secondary")}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      {open ? (
        <JobFormModal mode={mode} job={job} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

export function JobFormModal({
  mode,
  job,
  onClose,
}: {
  mode: Mode;
  job?: JobListItem;
  onClose: () => void;
}) {
  const uid = useId();
  const { mutate, isPending, error, reset } = useApiMutation<JobListItem>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();

    const body = {
      title: value("title"),
      department: value("department") || undefined,
      location: value("location") || undefined,
      employmentType: value("employmentType") || undefined,
      experience: value("experience") || undefined,
      description: value("description"),
      responsibilities: value("responsibilities") || undefined,
      requirements: value("requirements") || undefined,
      niceToHave: value("niceToHave") || undefined,
      salaryRange: value("salaryRange") || undefined,
      applicationDeadline: value("applicationDeadline") || undefined,
      status: value("status") || undefined,
    };

    const result =
      mode === "create"
        ? await mutate("/api/admin/careers/jobs", { method: "POST", body })
        : await mutate(`/api/admin/careers/jobs/${job!.id}`, {
            method: "PATCH",
            body,
          });

    if (result) {
      reset();
      onClose();
    }
  }

  if (!mounted) return null;

  const deadlineDefault = job?.applicationDeadline
    ? job.applicationDeadline.slice(0, 10)
    : "";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        className="relative z-10 flex h-[min(92vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 id={`${uid}-title`} className="text-sm font-semibold text-slate-900">
            {mode === "create" ? "Create job" : "Edit job"}
          </h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error.message}
              </p>
            ) : null}

            <Field
              label="Job title"
              htmlFor={`${uid}-title-field`}
              required
              error={error?.fields?.title}
            >
              <Input
                id={`${uid}-title-field`}
                name="title"
                required
                defaultValue={job?.title ?? ""}
                autoFocus
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Department" htmlFor={`${uid}-dept`}>
                <Input
                  id={`${uid}-dept`}
                  name="department"
                  defaultValue={job?.department ?? ""}
                />
              </Field>
              <Field label="Location" htmlFor={`${uid}-loc`}>
                <Input
                  id={`${uid}-loc`}
                  name="location"
                  defaultValue={job?.location ?? ""}
                />
              </Field>
              <Field label="Employment type" htmlFor={`${uid}-emp`}>
                <Select
                  id={`${uid}-emp`}
                  name="employmentType"
                  defaultValue={job?.employmentType ?? EmploymentType.FULL_TIME}
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {employmentTypeLabel(t)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Experience" htmlFor={`${uid}-exp`}>
                <Input
                  id={`${uid}-exp`}
                  name="experience"
                  placeholder="e.g. 3–5 years"
                  defaultValue={job?.experience ?? ""}
                />
              </Field>
            </div>

            <Field
              label="Description"
              htmlFor={`${uid}-desc`}
              required
              error={error?.fields?.description}
            >
              <Textarea
                id={`${uid}-desc`}
                name="description"
                required
                rows={4}
                defaultValue={job?.description ?? ""}
              />
            </Field>
            <Field label="Responsibilities" htmlFor={`${uid}-resp`}>
              <Textarea
                id={`${uid}-resp`}
                name="responsibilities"
                rows={3}
                defaultValue={job?.responsibilities ?? ""}
              />
            </Field>
            <Field label="Requirements" htmlFor={`${uid}-req`}>
              <Textarea
                id={`${uid}-req`}
                name="requirements"
                rows={3}
                defaultValue={job?.requirements ?? ""}
              />
            </Field>
            <Field label="Nice to have" htmlFor={`${uid}-nice`}>
              <Textarea
                id={`${uid}-nice`}
                name="niceToHave"
                rows={2}
                defaultValue={job?.niceToHave ?? ""}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Salary range" htmlFor={`${uid}-sal`}>
                <Input
                  id={`${uid}-sal`}
                  name="salaryRange"
                  defaultValue={job?.salaryRange ?? ""}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Application deadline" htmlFor={`${uid}-deadline`}>
                <Input
                  id={`${uid}-deadline`}
                  name="applicationDeadline"
                  type="date"
                  defaultValue={deadlineDefault}
                />
              </Field>
              <Field label="Status" htmlFor={`${uid}-status`}>
                <Select
                  id={`${uid}-status`}
                  name="status"
                  defaultValue={job?.status ?? JobStatus.DRAFT}
                >
                  {JOB_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : mode === "create" ? "Create job" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
