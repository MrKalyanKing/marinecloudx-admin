"use client";

/**
 * Task creation and completion.
 *
 * Both hit PATCH/POST /api/admin/tasks*, which require crm:write. `completedAt`
 * is never sent — the service stamps it when the status becomes COMPLETED, so
 * the timestamp and the status cannot disagree.
 */

import { useState } from "react";

import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";
import { Priority } from "@/contracts";
import type { CrmConfig } from "@/features/crm/types/crm";

export function CompleteTaskButton({
  taskId,
  isCompleted,
}: {
  taskId: string;
  isCompleted: boolean;
}) {
  const { mutate, isPending } = useApiMutation();

  return (
    <Button
      variant={isCompleted ? "ghost" : "secondary"}
      disabled={isPending}
      aria-label={isCompleted ? "Reopen task" : "Mark task complete"}
      onClick={() =>
        void mutate(`/api/admin/tasks/${taskId}`, {
          method: "PATCH",
          body: { status: isCompleted ? "PENDING" : "COMPLETED" },
        })
      }
    >
      {isPending ? "Saving…" : isCompleted ? "Reopen" : "Complete"}
    </Button>
  );
}

export function CreateTaskForm({
  users,
  leadId,
  compact = false,
}: {
  users: CrmConfig["users"];
  /** Pre-bound when created from a lead; omitted for standalone tasks. */
  leadId?: string;
  compact?: boolean;
}) {
  const { mutate, isPending, error } = useApiMutation();
  const [open, setOpen] = useState(!compact);
  const [title, setTitle] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const dueAt = String(form.get("dueAt") ?? "").trim();
    const assignedUserId = String(form.get("assignedUserId") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();

    const created = await mutate("/api/admin/tasks", {
      method: "POST",
      body: {
        title,
        description: description || undefined,
        leadId,
        assignedUserId: assignedUserId || undefined,
        priority: String(form.get("priority") ?? Priority.MEDIUM),
        // A date input gives YYYY-MM-DD; the API coerces it to a timestamp.
        dueAt: dueAt || undefined,
      },
    });

    if (created) {
      setTitle("");
      event.currentTarget.reset();
      if (compact) setOpen(false);
    }
  }

  if (compact && !open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Add follow-up
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3">
      {error ? (
        <p role="alert" className="mb-2 text-xs text-red-700">
          {error.message}
        </p>
      ) : null}

      <fieldset disabled={isPending} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Title" htmlFor="task-title" required error={error?.fields?.title}>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder="e.g. Call to confirm scope"
            />
          </Field>
        </div>

        <Field label="Assign to" htmlFor="task-assignee">
          <Select id="task-assignee" name="assignedUserId" defaultValue="">
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Due date" htmlFor="task-due" error={error?.fields?.dueAt}>
          <Input id="task-due" name="dueAt" type="date" />
        </Field>

        <Field label="Priority" htmlFor="task-priority">
          <Select id="task-priority" name="priority" defaultValue={Priority.MEDIUM}>
            {Object.values(Priority).map((priority) => (
              <option key={priority} value={priority}>
                {priority.charAt(0) + priority.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Description" htmlFor="task-description">
            <Textarea id="task-description" name="description" rows={2} />
          </Field>
        </div>
      </fieldset>

      <div className="mt-3 flex justify-end gap-2">
        {compact ? (
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending || title.trim() === ""}>
          {isPending ? "Creating…" : "Create task"}
        </Button>
      </div>
    </form>
  );
}
