import Link from "next/link";
import { notFound } from "next/navigation";

import {
  DueBadge,
  LeadStatusBadge,
  PriorityBadge,
  StageBadge,
  contactName,
  formatBudget,
  formatDate,
  formatDateTime,
  titleCase,
} from "@/features/crm/components/display";
import {
  AddNoteForm,
  AssignControl,
  EditLeadForm,
  LogActivityForm,
} from "@/features/crm/components/lead-actions";
import { StageSelect } from "@/features/crm/components/stage-select";
import { CompleteTaskButton, CreateTaskForm } from "@/features/crm/components/task-actions";
import { PageHeader } from "@/shared/components/admin/page-header";
import { Badge, Card, CardHeader, EmptyState, ErrorState } from "@/shared/components/primitives";
import { adminApiGet } from "@/lib/api/admin-api";
import { CAPABILITIES } from "@/contracts";
import { getSession } from "@/lib/auth";
import type { CrmConfig, LeadDetail } from "@/features/crm/types/crm";

interface PageProps {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 px-4 py-2 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-slate-800">{value || <span className="text-slate-400">—</span>}</dd>
    </div>
  );
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();
  const canWrite =
    Boolean(session) && session!.capabilities.includes(CAPABILITIES.CRM_WRITE);

  const [leadResult, configResult] = await Promise.all([
    adminApiGet<LeadDetail>(`/api/admin/leads/${id}`),
    adminApiGet<CrmConfig>("/api/admin/crm/config"),
  ]);

  if (!leadResult.ok) {
    if (leadResult.code === "NOT_FOUND") notFound();

    return (
      <>
        <PageHeader title="Lead" breadcrumbs={[{ label: "CRM", href: "/crm" }, { label: "Leads", href: "/crm/leads" }]} />
        <ErrorState code={leadResult.code} message={leadResult.message} />
      </>
    );
  }

  const lead = leadResult.data;
  const config = configResult.ok ? configResult.data : null;
  const name = contactName(lead.contact);
  const openTasks = lead.tasks.filter((task) => task.status !== "COMPLETED" && task.status !== "CANCELLED");
  const doneTasks = lead.tasks.filter((task) => task.status === "COMPLETED" || task.status === "CANCELLED");

  return (
    <>
      <PageHeader
        title={name}
        description={lead.companyName ?? lead.contact.company ?? undefined}
        breadcrumbs={[
          { label: "CRM", href: "/crm" },
          { label: "Leads", href: "/crm/leads" },
          { label: name },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StageBadge name={lead.pipelineStage.name} />
            <LeadStatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column: the record */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader title="Opportunity" />
            <dl>
              <DetailRow label="Stage" value={<StageBadge name={lead.pipelineStage.name} />} />
              <DetailRow label="Status" value={<LeadStatusBadge status={lead.status} />} />
              <DetailRow label="Source" value={lead.source.name} />
              <DetailRow label="Service" value={lead.service?.name} />
              <DetailRow label="Industry" value={lead.industry?.name} />
              <DetailRow label="Assigned to" value={lead.assignedUser?.name} />
              <DetailRow label="Created" value={formatDateTime(lead.createdAt)} />
              {lead.closedAt ? (
                <DetailRow label="Closed" value={formatDateTime(lead.closedAt)} />
              ) : null}
            </dl>
          </Card>

          <Card>
            <CardHeader
              title="Requirement"
              action={
                canWrite && config ? (
                  <EditLeadForm
                    leadId={lead.id}
                    config={config}
                    initial={{
                      companyName: lead.companyName,
                      requirement: lead.requirement,
                      timeline: lead.timeline,
                      priority: lead.priority,
                      serviceId: lead.service?.id ?? null,
                      industryId: lead.industry?.id ?? null,
                      budgetMin: lead.budgetMin,
                      budgetMax: lead.budgetMax,
                      budgetCurrency: lead.budgetCurrency,
                    }}
                  />
                ) : null
              }
            />
            <dl>
              <DetailRow
                label="Requirement"
                value={
                  lead.requirement ? (
                    <p className="whitespace-pre-wrap">{lead.requirement}</p>
                  ) : null
                }
              />
              <DetailRow
                label="Budget"
                value={formatBudget(lead.budgetMin, lead.budgetMax, lead.budgetCurrency)}
              />
              <DetailRow label="Timeline" value={lead.timeline} />
              <DetailRow label="Priority" value={<PriorityBadge priority={lead.priority} />} />
              <DetailRow
                label="Qualification"
                value={
                  lead.qualificationScore === null ? null : (
                    <Badge tone="teal">{lead.qualificationScore} / 100</Badge>
                  )
                }
              />
            </dl>
          </Card>

          <Card>
            <CardHeader
              title="Activity"
              description="System events and manually logged interactions."
            />
            {canWrite ? <LogActivityForm leadId={lead.id} /> : null}

            {lead.activities.length === 0 ? (
              <EmptyState title="No activity yet" />
            ) : (
              <ol className="divide-y divide-slate-100">
                {lead.activities.map((activity) => (
                  <li key={activity.id} className="flex gap-3 px-4 py-3">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">
                          {titleCase(activity.type)}
                        </p>
                        <time
                          dateTime={new Date(activity.occurredAt).toISOString()}
                          className="text-xs tabular-nums text-slate-500"
                        >
                          {formatDateTime(activity.occurredAt)}
                        </time>
                      </div>
                      {activity.description ? (
                        <p className="mt-0.5 text-sm text-slate-700">{activity.description}</p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-slate-500">
                        {activity.user?.name ?? "System"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card>
            <CardHeader title="Internal notes" description="Never shown on the public website." />
            {canWrite ? <AddNoteForm leadId={lead.id} /> : null}

            {lead.notes.length === 0 ? (
              <EmptyState title="No notes yet" />
            ) : (
              <ul className="divide-y divide-slate-100 border-t border-slate-200">
                {lead.notes.map((note) => (
                  <li key={note.id} className="px-4 py-3">
                    <p className="whitespace-pre-wrap text-sm text-slate-800">{note.content}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {note.author?.name ?? "Unknown"} · {formatDateTime(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column: people and actions */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Contact" />
            <dl>
              <DetailRow
                label="Name"
                value={
                  <Link
                    href={`/crm/contacts/${lead.contact.id}`}
                    className="text-teal-700 hover:underline"
                  >
                    {name}
                  </Link>
                }
              />
              <DetailRow
                label="Email"
                value={
                  lead.contact.email ? (
                    <a href={`mailto:${lead.contact.email}`} className="text-teal-700 hover:underline">
                      {lead.contact.email}
                    </a>
                  ) : null
                }
              />
              <DetailRow
                label="Phone"
                value={
                  lead.contact.phone ? (
                    <a href={`tel:${lead.contact.phone}`} className="text-teal-700 hover:underline">
                      {lead.contact.phone}
                    </a>
                  ) : null
                }
              />
              <DetailRow label="Company" value={lead.contact.company} />
              <DetailRow label="Job title" value={lead.contact.jobTitle} />
            </dl>
          </Card>

          {canWrite && config ? (
            <Card>
              <CardHeader
                title="Pipeline"
                description="Stage is where the lead sits; status is its lifecycle."
              />
              <div className="flex flex-col gap-3 px-4 py-3">
                <StageSelect
                  leadId={lead.id}
                  currentStageId={lead.pipelineStage.id}
                  stages={config.pipelineStages}
                />
                <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-medium text-slate-700">Status</span>
                  <LeadStatusBadge status={lead.status} />
                  <span className="ml-auto text-xs text-slate-500">Set automatically</span>
                </div>
              </div>
            </Card>
          ) : null}

          {canWrite && config ? (
            <Card>
              <CardHeader title="Assignment" />
              <div className="px-4 py-3">
                <AssignControl
                  leadId={lead.id}
                  currentUserId={lead.assignedUser?.id ?? null}
                  users={config.users}
                />
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Follow-ups"
              description={`${openTasks.length} open`}
            />
            {canWrite && config ? (
              <div className="border-b border-slate-200 px-4 py-3">
                <CreateTaskForm users={config.users} leadId={lead.id} compact />
              </div>
            ) : null}

            {lead.tasks.length === 0 ? (
              <EmptyState title="No follow-ups yet" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {[...openTasks, ...doneTasks].map((task) => (
                  <li key={task.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={
                            task.status === "COMPLETED"
                              ? "text-sm text-slate-500 line-through"
                              : "text-sm font-medium text-slate-900"
                          }
                        >
                          {task.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <DueBadge
                            dueAt={task.dueAt}
                            isClosed={task.status === "COMPLETED" || task.status === "CANCELLED"}
                          />
                          {task.assignedUser ? <span>{task.assignedUser.name}</span> : null}
                        </div>
                      </div>
                      {canWrite ? (
                        <CompleteTaskButton
                          taskId={task.id}
                          isCompleted={task.status === "COMPLETED"}
                        />
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Conversations"
              description="Chat sessions promoted into this lead."
            />
            {lead.conversations.length === 0 ? (
              <EmptyState title="No linked conversations" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {lead.conversations.map((conversation) => (
                  <li key={conversation.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="neutral">{titleCase(conversation.status)}</Badge>
                      <span className="text-xs tabular-nums text-slate-500">
                        {conversation._count.messages} messages
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Started {formatDate(conversation.startedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
