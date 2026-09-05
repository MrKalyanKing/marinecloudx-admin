import { Badge } from "@/shared/components/primitives";
import type { BadgeTone } from "@/shared/components/primitives";
import type { LeadStatus, Priority, TaskStatus } from "@/contracts";
import { formatDate, formatDateTime, formatNumber } from "@/shared/utils/format";

/**
 * Shared display helpers for CRM values.
 *
 * Pipeline stages are NOT here: they are configurable database rows, so their
 * names are always read from the API rather than mapped from a fixed list.
 */

/**
 * Date formatting lives in @/lib/format, shared with the public site so both
 * pin the same locale and timezone. Re-exported here so existing CRM imports
 * keep working.
 */
export { formatDate, formatDateTime };

export function formatBudget(
  min: number | null,
  max: number | null,
  currency: string | null,
): string {
  if (min === null && max === null) return "—";

  const code = currency ?? "";
  const format = formatNumber;

  if (min !== null && max !== null) return `${code} ${format(min)} – ${format(max)}`.trim();
  if (min !== null) return `${code} ${format(min)}+`.trim();

  return `Up to ${code} ${format(max as number)}`.trim();
}

export function contactName(contact: {
  firstName: string;
  lastName?: string | null;
}): string {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
}

const LEAD_STATUS_TONE: Record<LeadStatus, BadgeTone> = {
  OPEN: "blue",
  WON: "green",
  LOST: "red",
  ARCHIVED: "neutral",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={LEAD_STATUS_TONE[status]}>{titleCase(status)}</Badge>;
}

const PRIORITY_TONE: Record<Priority, BadgeTone> = {
  LOW: "neutral",
  MEDIUM: "blue",
  HIGH: "amber",
  URGENT: "red",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={PRIORITY_TONE[priority]}>{titleCase(priority)}</Badge>;
}

const TASK_STATUS_TONE: Record<TaskStatus, BadgeTone> = {
  PENDING: "amber",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  CANCELLED: "neutral",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={TASK_STATUS_TONE[status]}>{titleCase(status)}</Badge>;
}

/** Stage names come from the database, so only the value is styled. */
export function StageBadge({ name }: { name: string }) {
  return <Badge tone="teal">{name}</Badge>;
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Due-date state for follow-ups, computed against the current time. */
export type DueState = "none" | "overdue" | "today" | "upcoming";

export function dueState(dueAt: string | Date | null, isClosed: boolean): DueState {
  if (!dueAt || isClosed) return "none";

  const due = new Date(dueAt);
  const now = new Date();

  if (due.getTime() < now.getTime()) return "overdue";

  const isSameDay =
    due.getUTCFullYear() === now.getUTCFullYear() &&
    due.getUTCMonth() === now.getUTCMonth() &&
    due.getUTCDate() === now.getUTCDate();

  return isSameDay ? "today" : "upcoming";
}

export function DueBadge({ dueAt, isClosed }: { dueAt: string | Date | null; isClosed: boolean }) {
  const state = dueState(dueAt, isClosed);

  if (!dueAt) return <span className="text-slate-400">—</span>;

  if (state === "overdue") return <Badge tone="red">Overdue · {formatDate(dueAt)}</Badge>;
  if (state === "today") return <Badge tone="amber">Due today</Badge>;

  return <span className="tabular-nums">{formatDate(dueAt)}</span>;
}
