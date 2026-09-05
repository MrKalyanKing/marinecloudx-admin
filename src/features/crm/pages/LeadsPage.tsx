import Link from "next/link";

import { CreateLeadDialog } from "@/features/crm/components/create-lead-dialog";
import {
  LeadStatusBadge,
  PriorityBadge,
  StageBadge,
  contactName,
  formatDate,
} from "@/features/crm/components/display";
import { LeadFilters } from "@/features/crm/components/lead-filters";
import { StageSelect } from "@/features/crm/components/stage-select";
import { PageHeader } from "@/shared/components/admin/page-header";
import { Pagination } from "@/shared/components/pagination";
import {
  Card,
  EmptyState,
  ErrorState,
  TableWrap,
  Td,
  Th,
} from "@/shared/components/primitives";
import { adminApiGet, toQueryString } from "@/lib/api/admin-api";
import { CAPABILITIES } from "@/contracts";
import { getSession } from "@/lib/auth";
import type { CrmConfig, LeadListItem } from "@/features/crm/types/crm";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Search params arrive as string | string[]; only the first value is used. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getSession();
  const canWrite =
    Boolean(session) && session!.capabilities.includes(CAPABILITIES.CRM_WRITE);

  const query = {
    page: first(params.page),
    pageSize: first(params.pageSize),
    search: first(params.search),
    status: first(params.status),
    pipelineStageId: first(params.pipelineStageId),
    sourceId: first(params.sourceId),
    assignedUserId: first(params.assignedUserId),
    serviceId: first(params.serviceId),
  };

  // Filtering and pagination happen in the database via the API — the browser
  // never receives more than one page of rows.
  const [leadsResult, configResult] = await Promise.all([
    adminApiGet<LeadListItem[]>(`/api/admin/leads${toQueryString(query)}`),
    adminApiGet<CrmConfig>("/api/admin/crm/config"),
  ]);

  const config = configResult.ok ? configResult.data : null;

  const header = (
    <PageHeader
      title="Leads"
      description="Every opportunity in the pipeline."
      breadcrumbs={[{ label: "CRM", href: "/crm" }, { label: "Leads" }]}
      actions={canWrite && config ? <CreateLeadDialog config={config} /> : null}
    />
  );

  if (!leadsResult.ok) {
    return (
      <>
        {header}
        <ErrorState code={leadsResult.code} message={leadsResult.message} />
      </>
    );
  }

  const leads = leadsResult.data;
  const pagination = leadsResult.pagination;
  const hasFilters = Boolean(
    query.search ?? query.status ?? query.pipelineStageId ?? query.sourceId ?? query.assignedUserId,
  );

  return (
    <>
      {header}

      <Card>
        <LeadFilters config={config} values={query} />

        {leads.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No leads match these filters" : "No leads yet"}
            description={
              hasFilters
                ? "Try clearing the filters or widening your search."
                : "Leads captured from the website or created here will appear in this table."
            }
            action={
              hasFilters ? (
                <Link href="/crm/leads" className="text-sm text-teal-700 hover:underline">
                  Clear filters
                </Link>
              ) : null
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Contact</Th>
                <Th>Company</Th>
                <Th>Service</Th>
                <Th>Source</Th>
                <Th>Stage</Th>
                <Th>Status</Th>
                <Th>Priority</Th>
                <Th>Assigned</Th>
                <Th className="text-right">Created</Th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <Td>
                    <Link
                      href={`/crm/leads/${lead.id}`}
                      className="font-medium text-slate-900 hover:text-teal-700 hover:underline"
                    >
                      {contactName(lead.contact)}
                    </Link>
                    {lead.contact.email ? (
                      <p className="text-xs text-slate-500">{lead.contact.email}</p>
                    ) : null}
                  </Td>
                  <Td>{lead.companyName ?? lead.contact.company ?? "—"}</Td>
                  <Td>{lead.service?.name ?? "—"}</Td>
                  <Td>{lead.source.name}</Td>
                  <Td>
                    {/* Same API and component the board and detail page use. */}
                    {canWrite && config ? (
                      <StageSelect
                        leadId={lead.id}
                        currentStageId={lead.pipelineStage.id}
                        stages={config.pipelineStages}
                        label={`Stage for ${contactName(lead.contact)}`}
                        hideLabel
                        compact
                      />
                    ) : (
                      <StageBadge name={lead.pipelineStage.name} />
                    )}
                  </Td>
                  <Td>
                    <LeadStatusBadge status={lead.status} />
                  </Td>
                  <Td>
                    <PriorityBadge priority={lead.priority} />
                  </Td>
                  <Td>
                    {lead.assignedUser?.name ?? (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums">{formatDate(lead.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}

        {pagination ? (
          <Pagination
            pagination={pagination}
            basePath="/crm/leads"
            params={{
              search: query.search,
              status: query.status,
              pipelineStageId: query.pipelineStageId,
              sourceId: query.sourceId,
              assignedUserId: query.assignedUserId,
            }}
          />
        ) : null}
      </Card>
    </>
  );
}
