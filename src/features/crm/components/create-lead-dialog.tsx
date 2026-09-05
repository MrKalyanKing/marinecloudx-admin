"use client";

/**
 * Create Lead.
 *
 * Posts to POST /api/admin/leads, which requires crm:write. The dialog is only
 * rendered for users who hold that capability, but hiding it is convenience —
 * the endpoint rejects anyone else regardless.
 *
 * Backend Zod validation is the source of truth. The browser marks fields
 * required for usability, and field-level errors returned by the API are shown
 * against the right inputs rather than as one opaque message.
 */

import { useEffect, useRef, useState } from "react";

import { useApiMutation } from "@/shared/hooks/use-api-mutation";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/shared/components/primitives";
import { Priority } from "@/contracts";
import type { CrmConfig } from "@/features/crm/types/crm";

function toOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  const text = String(value ?? "").trim();

  if (!text) return undefined;

  const parsed = Number(text);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalString(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? "").trim();

  return text === "" ? undefined : text;
}

export function CreateLeadDialog({ config }: { config: CrmConfig }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending, error, reset } = useApiMutation<{ id: string }>();

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (open) firstFieldRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    reset();
  }

  async function handleSubmit(formData: FormData) {
    const payload = {
      contact: {
        firstName: String(formData.get("firstName") ?? "").trim(),
        lastName: toOptionalString(formData.get("lastName")),
        email: toOptionalString(formData.get("email")),
        phone: toOptionalString(formData.get("phone")),
        company: toOptionalString(formData.get("company")),
        jobTitle: toOptionalString(formData.get("jobTitle")),
      },
      companyName: toOptionalString(formData.get("companyName")),
      sourceSlug: String(formData.get("sourceSlug") ?? ""),
      pipelineStageId: toOptionalString(formData.get("pipelineStageId")),
      serviceId: toOptionalString(formData.get("serviceId")),
      industryId: toOptionalString(formData.get("industryId")),
      assignedUserId: toOptionalString(formData.get("assignedUserId")),
      requirement: toOptionalString(formData.get("requirement")),
      budgetMin: toOptionalNumber(formData.get("budgetMin")),
      budgetMax: toOptionalNumber(formData.get("budgetMax")),
      budgetCurrency: toOptionalString(formData.get("budgetCurrency")),
      timeline: toOptionalString(formData.get("timeline")),
      priority: String(formData.get("priority") ?? Priority.MEDIUM),
    };

    const created = await mutate("/api/admin/leads", { method: "POST", body: payload });

    if (created) close();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Create lead</Button>;
  }

  const fieldError = (path: string) => error?.fields?.[path];

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create lead</Button>

      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
        <button
          type="button"
          aria-label="Close dialog"
          onClick={close}
          className="absolute inset-0 cursor-default"
        />

        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-lead-title"
          className="relative z-10 my-8 w-full max-w-2xl rounded-lg bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 id="create-lead-title" className="text-sm font-semibold text-slate-900">
              Create lead
            </h2>
            <Button variant="ghost" onClick={close} aria-label="Close">
              ✕
            </Button>
          </div>

          <form action={handleSubmit} className="max-h-[70vh] overflow-y-auto px-4 py-4">
            {error ? (
              <p
                role="alert"
                className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {error.message}
              </p>
            ) : null}

            <fieldset disabled={isPending} className="contents">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contact
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="First name" htmlFor="firstName" required error={fieldError("contact.firstName")}>
                  <Input id="firstName" name="firstName" ref={firstFieldRef} required />
                </Field>
                <Field label="Last name" htmlFor="lastName" error={fieldError("contact.lastName")}>
                  <Input id="lastName" name="lastName" />
                </Field>
                <Field
                  label="Email"
                  htmlFor="email"
                  error={fieldError("contact.email")}
                  hint="Used to match repeat enquiries to one contact."
                >
                  <Input id="email" name="email" type="email" />
                </Field>
                <Field label="Phone" htmlFor="phone" error={fieldError("contact.phone")}>
                  <Input id="phone" name="phone" type="tel" />
                </Field>
                <Field label="Company" htmlFor="company" error={fieldError("contact.company")}>
                  <Input id="company" name="company" />
                </Field>
                <Field label="Job title" htmlFor="jobTitle" error={fieldError("contact.jobTitle")}>
                  <Input id="jobTitle" name="jobTitle" />
                </Field>
              </div>

              <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Opportunity
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Source" htmlFor="sourceSlug" required error={fieldError("sourceSlug")}>
                  <Select id="sourceSlug" name="sourceSlug" required defaultValue="">
                    <option value="" disabled>
                      Select a source
                    </option>
                    {config.sources.map((source) => (
                      <option key={source.id} value={source.slug}>
                        {source.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Pipeline stage"
                  htmlFor="pipelineStageId"
                  error={fieldError("pipelineStageId")}
                  hint="Defaults to the first active stage."
                >
                  <Select id="pipelineStageId" name="pipelineStageId" defaultValue="">
                    <option value="">Default</option>
                    {config.pipelineStages
                      .filter((stage) => !stage.isWon && !stage.isLost)
                      .map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                  </Select>
                </Field>

                <Field label="Company (this opportunity)" htmlFor="companyName">
                  <Input id="companyName" name="companyName" />
                </Field>

                <Field label="Assign to" htmlFor="assignedUserId" error={fieldError("assignedUserId")}>
                  <Select id="assignedUserId" name="assignedUserId" defaultValue="">
                    <option value="">Unassigned</option>
                    {config.users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Service" htmlFor="serviceId" error={fieldError("serviceId")}>
                  <Select id="serviceId" name="serviceId" defaultValue="">
                    <option value="">None</option>
                    {config.services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Industry" htmlFor="industryId" error={fieldError("industryId")}>
                  <Select id="industryId" name="industryId" defaultValue="">
                    <option value="">None</option>
                    {config.industries.map((industry) => (
                      <option key={industry.id} value={industry.id}>
                        {industry.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Priority" htmlFor="priority">
                  <Select id="priority" name="priority" defaultValue={Priority.MEDIUM}>
                    {Object.values(Priority).map((priority) => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0) + priority.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Timeline" htmlFor="timeline" error={fieldError("timeline")}>
                  <Input id="timeline" name="timeline" placeholder="e.g. within 3 months" />
                </Field>

                <Field label="Budget min" htmlFor="budgetMin" error={fieldError("budgetMin")}>
                  <Input id="budgetMin" name="budgetMin" type="number" min="0" step="1" />
                </Field>

                <Field label="Budget max" htmlFor="budgetMax" error={fieldError("budgetMax")}>
                  <Input id="budgetMax" name="budgetMax" type="number" min="0" step="1" />
                </Field>

                <Field
                  label="Currency"
                  htmlFor="budgetCurrency"
                  error={fieldError("budgetCurrency")}
                  hint="Required if a budget is given."
                >
                  <Input
                    id="budgetCurrency"
                    name="budgetCurrency"
                    maxLength={3}
                    placeholder="INR"
                    className="uppercase"
                  />
                </Field>
              </div>

              <div className="mt-3">
                <Field label="Requirement" htmlFor="requirement" error={fieldError("requirement")}>
                  <Textarea
                    id="requirement"
                    name="requirement"
                    rows={4}
                    placeholder="What did the prospect ask for?"
                  />
                </Field>
              </div>
            </fieldset>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <Button type="button" variant="secondary" onClick={close} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating…" : "Create lead"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
