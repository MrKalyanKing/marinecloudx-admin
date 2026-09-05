import Link from "next/link";
import { notFound } from "next/navigation";

import {
  LeadStatusBadge,
  PriorityBadge,
  StageBadge,
  contactName,
  formatDate,
  formatDateTime,
} from "@/features/crm/components/display";
import { PageHeader } from "@/shared/components/admin/page-header";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  TableWrap,
  Td,
  Th,
} from "@/shared/components/primitives";
import { adminApiGet } from "@/lib/api/admin-api";
import type { ContactDetail } from "@/features/crm/types/crm";

interface PageProps {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 px-4 py-2 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-slate-800">
        {value || <span className="text-slate-400">—</span>}
      </dd>
    </div>
  );
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await adminApiGet<ContactDetail>(`/api/admin/contacts/${id}`);

  if (!result.ok) {
    if (result.code === "NOT_FOUND") notFound();

    return (
      <>
        <PageHeader
          title="Contact"
          breadcrumbs={[
            { label: "CRM", href: "/crm" },
            { label: "Contacts", href: "/crm/contacts" },
          ]}
        />
        <ErrorState code={result.code} message={result.message} />
      </>
    );
  }

  const contact = result.data;
  const name = contactName(contact);

  return (
    <>
      <PageHeader
        title={name}
        description={contact.company ?? undefined}
        breadcrumbs={[
          { label: "CRM", href: "/crm" },
          { label: "Contacts", href: "/crm/contacts" },
          { label: name },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Details" />
          <dl>
            <DetailRow label="Name" value={name} />
            <DetailRow
              label="Email"
              value={
                contact.email ? (
                  <a href={`mailto:${contact.email}`} className="text-teal-700 hover:underline">
                    {contact.email}
                  </a>
                ) : null
              }
            />
            <DetailRow
              label="Phone"
              value={
                contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="text-teal-700 hover:underline">
                    {contact.phone}
                  </a>
                ) : null
              }
            />
            <DetailRow label="Company" value={contact.company} />
            <DetailRow label="Job title" value={contact.jobTitle} />
            <DetailRow
              label="Website"
              value={
                contact.website ? (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="break-all text-teal-700 hover:underline"
                  >
                    {contact.website}
                  </a>
                ) : null
              }
            />
            <DetailRow label="Added" value={formatDateTime(contact.createdAt)} />
          </dl>

          {contact.notes ? (
            <div className="border-t border-slate-200 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Internal notes
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{contact.notes}</p>
            </div>
          ) : null}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Leads"
            description="A contact is a person; each lead is a separate opportunity they raised."
            action={
              <span className="text-xs tabular-nums text-slate-500">
                {contact.leads.length} total
              </span>
            }
          />

          {contact.leads.length === 0 ? (
            <EmptyState
              title="No leads for this contact"
              description="This person exists in the CRM but has no opportunity attached yet."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
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
                {contact.leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <Td>
                      <Link
                        href={`/crm/leads/${lead.id}`}
                        className="font-medium text-slate-900 hover:text-teal-700 hover:underline"
                      >
                        {lead.companyName ?? contact.company ?? "View lead"}
                      </Link>
                    </Td>
                    <Td>{lead.service?.name ?? "—"}</Td>
                    <Td>{lead.source.name}</Td>
                    <Td>
                      <StageBadge name={lead.pipelineStage.name} />
                    </Td>
                    <Td>
                      <LeadStatusBadge status={lead.status} />
                    </Td>
                    <Td>
                      <PriorityBadge priority={lead.priority} />
                    </Td>
                    <Td>{lead.assignedUser?.name ?? <span className="text-slate-400">—</span>}</Td>
                    <Td className="text-right tabular-nums">{formatDate(lead.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>
      </div>
    </>
  );
}
