import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ApplicationStatusBadge,
  CandidateAvatar,
  applicationSourceLabel,
  experienceLabel,
  formatDate,
  formatDateTime,
  formatFileSize,
  formatRelativeTime,
} from "@/features/careers/components/display";
import { RejectStatusButton } from "@/features/careers/components/reject-button";
import { ResumeActions } from "@/features/careers/components/resume-actions";
import { ApplicationStatusSelect } from "@/features/careers/components/status-select";
import type { ApplicationDetail } from "@/features/careers/types/careers";
import { PageHeader } from "@/shared/components/admin/page-header";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
} from "@/shared/components/primitives";
import { ApplicationStatus, CAPABILITIES } from "@/contracts";
import { adminApiGet } from "@/lib/api/admin-api";
import { getSession } from "@/lib/auth";

interface PageProps {
  params: Promise<{ applicationId: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 px-4 py-2.5 last:border-b-0 sm:flex-row sm:items-start sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-slate-800">
        {value || <span className="text-slate-400">—</span>}
      </dd>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-teal-700 hover:underline"
    >
      {children}
    </a>
  );
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { applicationId } = await params;
  const session = await getSession();
  const canWrite =
    Boolean(session) && session!.capabilities.includes(CAPABILITIES.CAREERS_WRITE);

  const result = await adminApiGet<ApplicationDetail>(
    `/api/admin/careers/applications/${applicationId}`,
  );

  if (!result.ok) {
    if (result.code === "NOT_FOUND") notFound();
    return (
      <>
        <PageHeader
          title="Application"
          breadcrumbs={[
            { label: "Careers", href: "/careers/jobs" },
            { label: "Applications", href: "/careers/applications" },
          ]}
        />
        <ErrorState code={result.code} message={result.message} />
      </>
    );
  }

  const app = result.data;
  const now = new Date();

  return (
    <>
      <PageHeader
        title={app.candidateName}
        description={app.job?.title ?? app.currentJobTitle ?? undefined}
        breadcrumbs={[
          { label: "Careers", href: "/careers/jobs" },
          { label: "Applications", href: "/careers/applications" },
          { label: app.candidateName },
        ]}
        actions={<ApplicationStatusBadge status={app.status} />}
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <CandidateAvatar name={app.candidateName} />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900">{app.candidateName}</h2>
              <p className="text-sm text-slate-600">
                {app.currentJobTitle ?? app.job?.title ?? "Applicant"}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                <a href={`mailto:${app.email}`} className="hover:text-teal-700 hover:underline">
                  {app.email}
                </a>
                {app.phone ? (
                  <a href={`tel:${app.phone}`} className="hover:text-teal-700 hover:underline">
                    {app.phone}
                  </a>
                ) : null}
                {app.location ? <span>{app.location}</span> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="text-sm text-slate-600 lg:text-right">
              <p>
                Applied{" "}
                <span className="font-medium text-slate-900">{formatDate(app.createdAt)}</span>
              </p>
              <p className="text-xs text-slate-500" title={formatDateTime(app.createdAt)}>
                {formatRelativeTime(app.createdAt, now)}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              {canWrite ? (
                <>
                  <div className="min-w-44">
                    <ApplicationStatusSelect
                      applicationId={app.id}
                      currentStatus={app.status}
                      label="Change Status"
                      successMessage
                    />
                  </div>
                  {app.status !== ApplicationStatus.REJECTED ? (
                    <RejectStatusButton applicationId={app.id} />
                  ) : null}
                </>
              ) : null}
              <ResumeActions
                applicationId={app.id}
                fileName={null}
                hasResume={app.hasResume}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader title="Professional Summary" />
            <div className="px-4 py-4">
              {app.summary ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {app.summary}
                </p>
              ) : (
                <p className="text-sm text-slate-400">No summary provided.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Skills" />
            <div className="flex flex-wrap gap-2 px-4 py-4">
              {app.skills.length > 0 ? (
                app.skills.map((skill) => (
                  <Badge key={skill} tone="teal">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-400">No skills listed.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Work Experience" />
            {app.workExperience.length === 0 ? (
              <div className="px-4 py-4">
                <p className="text-sm text-slate-400">No work experience listed.</p>
              </div>
            ) : (
              <ol className="relative my-4 ml-6 space-y-0 border-l border-slate-200">
                {app.workExperience.map((exp, index) => (
                  <li key={`${exp.company}-${index}`} className="relative pb-6 pl-6 last:pb-0">
                    <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-teal-600 ring-4 ring-white" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      {exp.position ?? "Role"}
                    </h3>
                    <p className="text-sm font-medium text-slate-700">{exp.company ?? "—"}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[exp.startDate, exp.endDate ?? (exp.isCurrent ? "Present" : null)]
                        .filter(Boolean)
                        .join(" – ")}
                    </p>
                    {exp.description ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                        {exp.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card>
            <CardHeader title="Education" />
            {app.education.length === 0 ? (
              <div className="px-4 py-4">
                <p className="text-sm text-slate-400">No education listed.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {app.education.map((edu, index) => (
                  <li key={`${edu.institution}-${index}`} className="px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {edu.degree ?? "Degree"}
                      {edu.field ? ` · ${edu.field}` : ""}
                    </h3>
                    <p className="text-sm text-slate-700">{edu.institution ?? "—"}</p>
                    <p className="text-xs text-slate-500">
                      {[edu.startDate, edu.endDate].filter(Boolean).join(" – ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {app.coverLetter ? (
            <Card>
              <CardHeader title="Cover Letter" />
              <div className="px-4 py-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {app.coverLetter}
                </p>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Application Summary" />
            <dl>
              <DetailRow label="Application ID" value={<span className="font-mono">{app.applicationCode}</span>} />
              <DetailRow label="Position" value={app.job?.title} />
              <DetailRow
                label="Job ID"
                value={app.job?.jobCode ? <span className="font-mono">{app.job.jobCode}</span> : null}
              />
              <DetailRow
                label="Status"
                value={<ApplicationStatusBadge status={app.status} />}
              />
              <DetailRow label="Experience" value={experienceLabel(app.yearsOfExperience)} />
              <DetailRow
                label="Application method"
                value={applicationSourceLabel(app.applicationSource)}
              />
              <DetailRow label="Applied" value={formatDateTime(app.createdAt)} />
              <DetailRow label="Notice period" value={app.noticePeriod} />
              <DetailRow label="Current CTC" value={app.currentCtc} />
              <DetailRow label="Expected CTC" value={app.expectedCtc} />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Contact Information" />
            <dl>
              <DetailRow
                label="Email"
                value={
                  <a href={`mailto:${app.email}`} className="text-teal-700 hover:underline">
                    {app.email}
                  </a>
                }
              />
              <DetailRow
                label="Phone"
                value={
                  app.phone ? (
                    <a href={`tel:${app.phone}`} className="text-teal-700 hover:underline">
                      {app.phone}
                    </a>
                  ) : null
                }
              />
              <DetailRow label="Location" value={app.location} />
              <DetailRow
                label="LinkedIn"
                value={
                  app.linkedinUrl ? (
                    <ExternalLink href={app.linkedinUrl}>{app.linkedinUrl}</ExternalLink>
                  ) : null
                }
              />
              <DetailRow
                label="GitHub"
                value={
                  app.githubUrl ? (
                    <ExternalLink href={app.githubUrl}>{app.githubUrl}</ExternalLink>
                  ) : null
                }
              />
              <DetailRow
                label="Portfolio"
                value={
                  app.portfolioUrl ? (
                    <ExternalLink href={app.portfolioUrl}>{app.portfolioUrl}</ExternalLink>
                  ) : null
                }
              />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Resume" />
            <div className="px-4 py-4">
              <ResumeActions
                applicationId={app.id}
                fileName={app.resumeFileName}
                mimeType={app.resumeMimeType}
                sizeLabel={formatFileSize(app.resumeSize)}
                hasResume={app.hasResume}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Application Timeline" />
            {app.activities.length === 0 ? (
              <EmptyState title="No activity yet" description="Status changes will appear here." />
            ) : (
              <ul className="divide-y divide-slate-100 px-4 py-2">
                {[...app.activities].reverse().map((activity) => (
                  <li key={activity.id} className="flex gap-3 py-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">
                        {formatDateTime(activity.createdAt)}
                      </p>
                      <p className="text-sm text-slate-800">
                        {activity.description ?? activity.action}
                      </p>
                      {activity.performedBy ? (
                        <p className="text-xs text-slate-500">by {activity.performedBy.name}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {app.job ? (
            <Card>
              <div className="px-4 py-3">
                <Link
                  href={`/careers/applications?jobId=${app.job.id}`}
                  className="text-sm text-teal-700 hover:underline"
                >
                  View all applications for {app.job.title} →
                </Link>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
