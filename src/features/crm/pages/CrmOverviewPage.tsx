import Link from "next/link";

import {
  LeadStatusBadge,
  StageBadge,
  contactName,
  formatDate,
  formatDateTime,
} from "@/features/crm/components/display";
import { PageHeader } from "@/shared/components/admin/page-header";
import {
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  StatTile,
} from "@/shared/components/primitives";
import { adminApiGet } from "@/lib/api/admin-api";
import type { DashboardData } from "@/features/crm/types/crm";

export default async function CrmOverviewPage() {
  const result = await adminApiGet<DashboardData>("/api/admin/dashboard");

  const header = (
    <PageHeader
      title="CRM overview"
      description="Pipeline health and outstanding work."
      breadcrumbs={[{ label: "CRM" }]}
      actions={<ButtonLink href="/crm/leads">All leads</ButtonLink>}
    />
  );

  if (!result.ok) {
    return (
      <>
        {header}
        <ErrorState code={result.code} message={result.message} />
      </>
    );
  }

  const { leads, contacts, tasks, pipeline, recentLeads, recentStageChanges } = result.data;

  return (
    <>
      {header}

      <section aria-label="Quick actions" className="mb-4 flex flex-wrap gap-2">
        <ButtonLink href="/crm/pipeline" variant="secondary">
          Pipeline board
        </ButtonLink>
        <ButtonLink href="/crm/leads" variant="secondary">
          Leads
        </ButtonLink>
        <ButtonLink href="/crm/contacts" variant="secondary">
          Contacts
        </ButtonLink>
        <ButtonLink href="/crm/tasks" variant="secondary">
          Tasks
        </ButtonLink>
        <ButtonLink href="/crm/tasks?overdueOnly=true" variant="secondary">
          Overdue follow-ups
        </ButtonLink>
      </section>

      <section aria-label="CRM metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Total leads" value={leads.total} />
        <StatTile label="Open" value={leads.open} />
        <StatTile label="Won" value={leads.won} tone="positive" />
        <StatTile label="Contacts" value={contacts.total} />
        <StatTile
          label="Overdue tasks"
          value={tasks.overdue}
          tone={tasks.overdue > 0 ? "danger" : "default"}
          hint={`${tasks.open} open`}
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Pipeline"
            description="Configured stages, in their configured order."
          />
          {pipeline.length === 0 ? (
            <EmptyState
              title="No pipeline stages configured"
              description="Run the database seed to create the default stages."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pipeline.map((stage) => (
                <li key={stage.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <Link
                    href={`/crm/leads?pipelineStageId=${stage.id}`}
                    className="text-sm text-slate-800 hover:text-teal-700 hover:underline"
                  >
                    {stage.name}
                  </Link>
                  <span className="text-sm font-medium tabular-nums text-slate-900">
                    {stage.leadCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent leads"
            action={
              <Link href="/crm/leads" className="text-xs text-teal-700 hover:underline">
                View all
              </Link>
            }
          />
          {recentLeads.length === 0 ? (
            <EmptyState title="No leads yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/crm/leads/${lead.id}`}
                      className="truncate text-sm font-medium text-slate-900 hover:text-teal-700 hover:underline"
                    >
                      {contactName(lead.contact)}
                    </Link>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <StageBadge name={lead.pipelineStage.name} />
                    <span className="tabular-nums">{formatDate(lead.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Card className="mt-4">
        <CardHeader
          title="Recent stage movements"
          description="Every pipeline transition, with who moved it."
        />
        {recentStageChanges.length === 0 ? (
          <EmptyState
            title="No stage movements yet"
            description="Moving a lead on the pipeline board records an entry here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentStageChanges.map((change) => (
              <li key={change.id} className="flex flex-wrap items-baseline gap-2 px-4 py-2.5">
                <Link
                  href={`/crm/leads/${change.lead.id}`}
                  className="text-sm font-medium text-slate-900 hover:text-teal-700 hover:underline"
                >
                  {contactName(change.lead.contact)}
                </Link>
                <span className="text-sm text-slate-600">
                  {change.description ?? "Stage changed"}
                </span>
                <span className="text-xs text-slate-500">
                  · {change.user?.name ?? "System"}
                </span>
                <time
                  dateTime={new Date(change.occurredAt).toISOString()}
                  className="ml-auto text-xs tabular-nums text-slate-500"
                >
                  {formatDateTime(change.occurredAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
