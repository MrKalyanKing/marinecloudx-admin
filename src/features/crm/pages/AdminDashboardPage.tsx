import Link from "next/link";

import {
  LeadStatusBadge,
  StageBadge,
  contactName,
  formatDate,
  formatDateTime,
  titleCase,
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
import { CAPABILITIES } from "@/contracts";
import { getSession } from "@/lib/auth";
import type { DashboardData } from "@/features/crm/types/crm";

export default async function AdminDashboardPage() {
  const session = await getSession();
  const capabilities = session?.capabilities ?? [];
  const canReadCrm = capabilities.includes(CAPABILITIES.CRM_READ);
  const firstName = session?.name.split(" ")[0] ?? "";

  // A content manager has no CRM access, so there are no metrics to show them.
  if (!canReadCrm) {
    return (
      <>
        <PageHeader title={`Welcome back, ${firstName}`} description="MarineCloudeX admin." />
        <Card>
          <EmptyState
            title="No dashboard widgets for your role yet"
            description="CRM metrics are limited to CRM roles. Your CMS workspace arrives in a later step."
          />
        </Card>
      </>
    );
  }

  const result = await adminApiGet<DashboardData>("/api/admin/dashboard");

  if (!result.ok) {
    return (
      <>
        <PageHeader title={`Welcome back, ${firstName}`} description="MarineCloudeX admin." />
        <ErrorState code={result.code} message={result.message} />
      </>
    );
  }

  const { leads, contacts, tasks, pipeline, recentLeads, recentActivities } = result.data;
  const totalPipelineLeads = pipeline.reduce((sum, stage) => sum + stage.leadCount, 0);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Live figures from the CRM database."
        actions={<ButtonLink href="/crm/leads">View leads</ButtonLink>}
      />

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile label="Total leads" value={leads.total} />
        <StatTile label="Open" value={leads.open} tone="default" />
        <StatTile label="Won" value={leads.won} tone="positive" />
        <StatTile label="Lost" value={leads.lost} />
        <StatTile label="Open tasks" value={tasks.open} />
        <StatTile
          label="Overdue"
          value={tasks.overdue}
          tone={tasks.overdue > 0 ? "danger" : "default"}
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Pipeline"
            description="Stage names and order come from the configurable pipeline, not from code."
          />
          {pipeline.length === 0 ? (
            <EmptyState
              title="No pipeline stages configured"
              description="Run the database seed to create the default stages."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pipeline.map((stage) => {
                const share =
                  totalPipelineLeads === 0
                    ? 0
                    : Math.round((stage.leadCount / totalPipelineLeads) * 100);

                return (
                  <li key={stage.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-40 shrink-0 truncate text-sm text-slate-700">
                      {stage.name}
                    </div>
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
                      role="img"
                      aria-label={`${stage.name}: ${stage.leadCount} leads`}
                    >
                      <div
                        className={
                          stage.isWon
                            ? "h-full rounded-full bg-green-600"
                            : stage.isLost
                              ? "h-full rounded-full bg-slate-400"
                              : "h-full rounded-full bg-teal-600"
                        }
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-slate-900">
                      {stage.leadCount}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Contacts" />
          <div className="px-4 py-4">
            <p className="text-3xl font-semibold tabular-nums text-slate-900">{contacts.total}</p>
            <p className="mt-1 text-sm text-slate-600">
              People in the CRM. One contact can hold several leads.
            </p>
            <ButtonLink href="/crm/contacts" variant="secondary" className="mt-3">
              View contacts
            </ButtonLink>
          </div>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
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
            <EmptyState
              title="No leads yet"
              description="Leads captured from the website or created here will appear in this list."
            />
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
                    <span className="truncate">{lead.companyName ?? "No company"}</span>
                    <StageBadge name={lead.pipelineStage.name} />
                    <span className="tabular-nums">{formatDate(lead.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent activity" />
          {recentActivities.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Lead events appear here as the team works the pipeline."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm text-slate-800">
                      {activity.description ?? titleCase(activity.type)}
                    </p>
                    <time
                      dateTime={new Date(activity.occurredAt).toISOString()}
                      className="shrink-0 text-xs tabular-nums text-slate-500"
                    >
                      {formatDateTime(activity.occurredAt)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <Link
                      href={`/crm/leads/${activity.lead.id}`}
                      className="hover:text-teal-700 hover:underline"
                    >
                      {contactName(activity.lead.contact)}
                    </Link>
                    {" · "}
                    {activity.user?.name ?? "System"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </>
  );
}
