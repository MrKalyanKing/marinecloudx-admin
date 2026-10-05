import { ApplicationSource, ApplicationStatus, EmploymentType, JobStatus } from "@/contracts";
import { Badge, type BadgeTone } from "@/shared/components/primitives";
import { formatDate, formatDateTime } from "@/shared/utils/format";

export { formatDate, formatDateTime };

const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; tone: BadgeTone }
> = {
  [ApplicationStatus.NEW]: { label: "Submitted", tone: "blue" },
  [ApplicationStatus.UNDER_REVIEW]: { label: "Under Review", tone: "amber" },
  [ApplicationStatus.SHORTLISTED]: { label: "Shortlisted", tone: "teal" },
  [ApplicationStatus.INTERVIEW]: { label: "Interview", tone: "blue" },
  [ApplicationStatus.SELECTED]: { label: "Selected", tone: "green" },
  [ApplicationStatus.REJECTED]: { label: "Rejected", tone: "red" },
};

const JOB_STATUS_META: Record<JobStatus, { label: string; tone: BadgeTone }> = {
  [JobStatus.DRAFT]: { label: "Draft", tone: "neutral" },
  [JobStatus.PUBLISHED]: { label: "Published", tone: "green" },
  [JobStatus.CLOSED]: { label: "Closed", tone: "amber" },
  [JobStatus.ARCHIVED]: { label: "Archived", tone: "slate" },
};

const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  [EmploymentType.FULL_TIME]: "Full-time",
  [EmploymentType.PART_TIME]: "Part-time",
  [EmploymentType.CONTRACT]: "Contract",
  [EmploymentType.INTERNSHIP]: "Internship",
  [EmploymentType.FREELANCE]: "Freelance",
};

const SOURCE_LABEL: Record<ApplicationSource, string> = {
  [ApplicationSource.RESUME_UPLOAD]: "Resume Auto-fill",
  [ApplicationSource.MANUAL_APPLICATION]: "Manual",
  [ApplicationSource.CAREERS_PAGE]: "Careers Page",
  [ApplicationSource.LINKEDIN]: "LinkedIn",
  [ApplicationSource.CAREERS]: "Careers Page",
  [ApplicationSource.REFERRAL]: "Referral",
  [ApplicationSource.MANUAL]: "Manual Entry",
  [ApplicationSource.OTHER]: "Other",
};

export function applicationStatusLabel(status: ApplicationStatus): string {
  return APPLICATION_STATUS_META[status]?.label ?? status;
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = APPLICATION_STATUS_META[status] ?? { label: status, tone: "neutral" as BadgeTone };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const meta = JOB_STATUS_META[status] ?? { label: status, tone: "neutral" as BadgeTone };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function employmentTypeLabel(type: EmploymentType): string {
  return EMPLOYMENT_LABEL[type] ?? type;
}

export function applicationSourceLabel(source: ApplicationSource): string {
  return SOURCE_LABEL[source] ?? source;
}

export function candidateInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function CandidateAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200"
    >
      {candidateInitials(name)}
    </span>
  );
}

/** Relative time pinned to a fixed clock for hydration safety when used client-side.
 *  For server components, pass `now` from the server render. */
export function formatRelativeTime(
  value: string | Date,
  now: Date = new Date(),
): string {
  const then = new Date(value).getTime();
  const diffMs = now.getTime() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function experienceLabel(years: number | null | undefined): string {
  if (years === null || years === undefined) return "—";
  if (years === 1) return "1 year";
  return `${years} years`;
}

export const APPLICATION_STATUSES = Object.values(ApplicationStatus);
export const JOB_STATUSES = Object.values(JobStatus);
export const EMPLOYMENT_TYPES = Object.values(EmploymentType);
