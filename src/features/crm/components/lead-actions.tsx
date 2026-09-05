"use client";

/**
 * Interactive controls on the lead detail page.
 *
 * Each posts to a protected endpoint requiring crm:write and then calls
 * router.refresh() through useApiMutation, so the server-rendered timeline and
 * lists update in place without a full page reload.
 *
 * None of these send an actor id — authorship always comes from the session.
 */

import { useState } from "react";

import { titleCase } from "@/features/crm/components/display";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";
import type { CrmConfig } from "@/features/crm/types/crm";

const LOGGABLE_ACTIVITY_TYPES = [
  "CALL",
  "EMAIL",
  "MEETING",
  "MESSAGE",
  "WHATSAPP",
  "PROPOSAL_SENT",
  "FOLLOW_UP",
  "OTHER",
] as const;

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="alert" className="mt-1 text-xs text-red-700">
      {message}
    </p>
  );
}

/** Assign or unassign the lead. Submits on change — no separate save button. */
export function AssignControl({
  leadId,
  currentUserId,
  users,
}: {
  leadId: string;
  currentUserId: string | null;
  users: CrmConfig["users"];
}) {
  const { mutate, isPending, error } = useApiMutation();
  const [value, setValue] = useState(currentUserId ?? "");

  async function handleChange(next: string) {
    setValue(next);
    await mutate(`/api/admin/leads/${leadId}/assign`, {
      method: "PATCH",
      body: { assignedUserId: next === "" ? null : next },
    });
  }

  return (
    <div>
      <label htmlFor="assignee" className="text-xs font-medium text-slate-700">
        Assigned to
      </label>
      <Select
        id="assignee"
        value={value}
        disabled={isPending}
        onChange={(event) => void handleChange(event.target.value)}
        className="mt-1"
      >
        <option value="">Unassigned</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} · {user.role.name}
          </option>
        ))}
      </Select>
      {isPending ? <p className="mt-1 text-xs text-slate-500">Saving…</p> : null}
      <ErrorText message={error?.message} />
    </div>
  );
}

/** Adds an internal note. Notes never reach the public website. */
export function AddNoteForm({ leadId }: { leadId: string }) {
  const { mutate, isPending, error } = useApiMutation();
  const [content, setContent] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const created = await mutate(`/api/admin/leads/${leadId}/notes`, {
      method: "POST",
      body: { content },
    });

    if (created) setContent("");
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3">
      <Field
        label="Add an internal note"
        htmlFor="note-content"
        error={error?.fields?.content ?? error?.message}
        hint="Visible to the internal team only."
      >
        <Textarea
          id="note-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          required
          disabled={isPending}
          placeholder="e.g. Client wants the first version before October."
        />
      </Field>
      <div className="mt-2 flex justify-end">
        <Button type="submit" disabled={isPending || content.trim() === ""}>
          {isPending ? "Saving…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Edits the lead's business fields.
 *
 * Stage, status and assignment are absent by design — each has its own control
 * and its own endpoint, so this form cannot be used to sidestep the lifecycle
 * rules. Only fields the user actually changed are sent.
 */
export function EditLeadForm({
  leadId,
  initial,
  config,
}: {
  leadId: string;
  initial: {
    companyName: string | null;
    requirement: string | null;
    timeline: string | null;
    priority: string;
    serviceId: string | null;
    industryId: string | null;
    budgetMin: number | null;
    budgetMax: number | null;
    budgetCurrency: string | null;
  };
  config: CrmConfig;
}) {
  const { mutate, isPending, error } = useApiMutation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Send only what changed, so a concurrent edit to another field survives.
    const patch: Record<string, unknown> = {};
    for (const key of Object.keys(form) as (keyof typeof form)[]) {
      if (form[key] !== initial[key]) patch[key] = form[key];
    }

    if (Object.keys(patch).length === 0) {
      setOpen(false);
      return;
    }

    const updated = await mutate(`/api/admin/leads/${leadId}`, { method: "PATCH", body: patch });

    if (updated) {
      setSaved(true);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Edit details
        </Button>
        {saved ? <span className="text-xs text-teal-700">Saved</span> : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Company" htmlFor="edit-company" error={error?.fields?.companyName}>
          <Input
            id="edit-company"
            value={form.companyName ?? ""}
            onChange={(event) => set("companyName", event.target.value || null)}
            disabled={isPending}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Requirement" htmlFor="edit-requirement" error={error?.fields?.requirement}>
          <Textarea
            id="edit-requirement"
            rows={3}
            value={form.requirement ?? ""}
            onChange={(event) => set("requirement", event.target.value || null)}
            disabled={isPending}
          />
        </Field>
      </div>

      <Field label="Service" htmlFor="edit-service">
        <Select
          id="edit-service"
          value={form.serviceId ?? ""}
          disabled={isPending}
          onChange={(event) => set("serviceId", event.target.value || null)}
        >
          <option value="">None</option>
          {config.services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Industry" htmlFor="edit-industry">
        <Select
          id="edit-industry"
          value={form.industryId ?? ""}
          disabled={isPending}
          onChange={(event) => set("industryId", event.target.value || null)}
        >
          <option value="">None</option>
          {config.industries.map((industry) => (
            <option key={industry.id} value={industry.id}>
              {industry.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Budget min" htmlFor="edit-budget-min" error={error?.fields?.budgetMin}>
        <Input
          id="edit-budget-min"
          type="number"
          min={0}
          value={form.budgetMin ?? ""}
          onChange={(event) =>
            set("budgetMin", event.target.value === "" ? null : Number(event.target.value))
          }
          disabled={isPending}
        />
      </Field>

      <Field label="Budget max" htmlFor="edit-budget-max" error={error?.fields?.budgetMax}>
        <Input
          id="edit-budget-max"
          type="number"
          min={0}
          value={form.budgetMax ?? ""}
          onChange={(event) =>
            set("budgetMax", event.target.value === "" ? null : Number(event.target.value))
          }
          disabled={isPending}
        />
      </Field>

      <Field
        label="Currency"
        htmlFor="edit-currency"
        hint="3-letter code, e.g. INR"
        error={error?.fields?.budgetCurrency}
      >
        <Input
          id="edit-currency"
          maxLength={3}
          value={form.budgetCurrency ?? ""}
          onChange={(event) => set("budgetCurrency", event.target.value.toUpperCase() || null)}
          disabled={isPending}
        />
      </Field>

      <Field label="Timeline" htmlFor="edit-timeline" error={error?.fields?.timeline}>
        <Input
          id="edit-timeline"
          value={form.timeline ?? ""}
          onChange={(event) => set("timeline", event.target.value || null)}
          disabled={isPending}
          placeholder="e.g. before October"
        />
      </Field>

      <Field label="Priority" htmlFor="edit-priority">
        <Select
          id="edit-priority"
          value={form.priority}
          disabled={isPending}
          onChange={(event) => set("priority", event.target.value)}
        >
          {["LOW", "MEDIUM", "HIGH", "URGENT"].map((level) => (
            <option key={level} value={level}>
              {titleCase(level)}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            setForm(initial);
            setOpen(false);
          }}
        >
          Cancel
        </Button>
        <ErrorText message={error?.message} />
      </div>
    </form>
  );
}

/**
 * Logs a manual activity.
 *
 * Only human-loggable types are offered. System events such as LEAD_CREATED are
 * emitted by the code paths that cause them and are rejected here by the API.
 */
export function LogActivityForm({ leadId }: { leadId: string }) {
  const { mutate, isPending, error } = useApiMutation();
  const [type, setType] = useState<string>("CALL");
  const [description, setDescription] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const created = await mutate(`/api/admin/leads/${leadId}/activities`, {
      method: "POST",
      body: { type, description: description.trim() || undefined },
    });

    if (created) setDescription("");
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-slate-200 px-4 py-3">
      <div className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <Field label="Log activity" htmlFor="activity-type">
          <Select
            id="activity-type"
            value={type}
            disabled={isPending}
            onChange={(event) => setType(event.target.value)}
          >
            {LOGGABLE_ACTIVITY_TYPES.map((activityType) => (
              <option key={activityType} value={activityType}>
                {titleCase(activityType)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Note" htmlFor="activity-description">
          <Textarea
            id="activity-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={1}
            disabled={isPending}
            className="min-h-0"
            placeholder="What happened?"
          />
        </Field>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Logging…" : "Log"}
        </Button>
      </div>
      <ErrorText message={error?.message} />
    </form>
  );
}
