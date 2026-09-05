import Link from "next/link";

import { formatDate } from "@/features/crm/components/display";
import { PageHeader } from "@/shared/components/admin/page-header";
import { Pagination } from "@/shared/components/pagination";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  TableWrap,
  Td,
  Th,
} from "@/shared/components/primitives";
import { adminApiGet, toQueryString } from "@/lib/api/admin-api";
import type { ContactListItem } from "@/features/crm/types/crm";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = {
    page: first(params.page),
    pageSize: first(params.pageSize),
    search: first(params.search),
  };

  const result = await adminApiGet<ContactListItem[]>(
    `/api/admin/contacts${toQueryString(query)}`,
  );

  const header = (
    <PageHeader
      title="Contacts"
      description="People who have engaged with MarineCloudeX. One contact can hold several leads."
      breadcrumbs={[{ label: "CRM", href: "/crm" }, { label: "Contacts" }]}
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

  const contacts = result.data;

  return (
    <>
      {header}

      <Card>
        <form method="get" className="border-b border-slate-200 px-4 py-3">
          <input type="hidden" name="page" value="1" />
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-56 flex-1">
              <label htmlFor="contact-search" className="sr-only">
                Search contacts
              </label>
              <Input
                id="contact-search"
                name="search"
                type="search"
                defaultValue={query.search ?? ""}
                placeholder="Search name, email, phone, company"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
            {query.search ? (
              <Link
                href="/crm/contacts"
                className="rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>

        {contacts.length === 0 ? (
          <EmptyState
            title={query.search ? "No contacts match that search" : "No contacts yet"}
            description={
              query.search
                ? "Try a different name, email or company."
                : "Contacts are created automatically when a lead is captured."
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Company</Th>
                <Th>Job title</Th>
                <Th className="text-right">Leads</Th>
                <Th className="text-right">Added</Th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50">
                  <Td>
                    <Link
                      href={`/crm/contacts/${contact.id}`}
                      className="font-medium text-slate-900 hover:text-teal-700 hover:underline"
                    >
                      {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                    </Link>
                  </Td>
                  <Td>{contact.email ?? "—"}</Td>
                  <Td>{contact.phone ?? "—"}</Td>
                  <Td>{contact.company ?? "—"}</Td>
                  <Td>{contact.jobTitle ?? "—"}</Td>
                  <Td className="text-right tabular-nums">{contact._count.leads}</Td>
                  <Td className="text-right tabular-nums">{formatDate(contact.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}

        {result.pagination ? (
          <Pagination
            pagination={result.pagination}
            basePath="/crm/contacts"
            params={{ search: query.search }}
          />
        ) : null}
      </Card>
    </>
  );
}
