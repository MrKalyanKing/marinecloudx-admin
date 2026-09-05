import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/shared/components/admin/page-header";
import { Pagination } from "@/shared/components/pagination";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Td,
  TableWrap,
  Th,
} from "@/shared/components/primitives";
import { adminApiGet, toQueryString } from "@/lib/api/admin-api";
import { formatDate } from "@/shared/utils/format";
import { getResource, isCmsResourceKey } from "@/features/cms/registry";
import { CAPABILITIES } from "@/contracts";
import { getSession } from "@/lib/auth";

interface PageProps {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type Row = Record<string, unknown>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object" && "name" in (value as Row)) return String((value as Row).name);
  return "—";
}

export default async function CmsListPage({ params, searchParams }: PageProps) {
  const { resource: key } = await params;

  if (!isCmsResourceKey(key)) notFound();

  const resource = getResource(key);
  const query = await searchParams;
  const session = await getSession();
  const canWrite =
    Boolean(session) && session!.capabilities.includes(CAPABILITIES.CMS_WRITE);

  const filters = {
    page: first(query.page),
    pageSize: first(query.pageSize),
    search: first(query.search),
    status: first(query.status),
  };

  const result = await adminApiGet<Row[]>(`/api/admin/cms/${key}${toQueryString(filters)}`);

  const header = (
    <PageHeader
      title={resource.label}
      breadcrumbs={[{ label: "CMS", href: "/cms" }, { label: resource.label }]}
      actions={
        canWrite ? (
          <ButtonLink href={`/cms/${key}/new`}>New {resource.singular.toLowerCase()}</ButtonLink>
        ) : null
      }
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

  const rows = result.data;
  const hasPublication = resource.publication !== "none";
  const hasFilters = Boolean(filters.search ?? filters.status);

  return (
    <>
      {header}

      <Card className="mb-4">
        <form method="get" className="flex flex-wrap items-end gap-2 px-4 py-3">
          {resource.searchFields.length > 0 ? (
            <div className="min-w-56 flex-1">
              <label htmlFor="cms-search" className="text-xs font-medium text-slate-700">
                Search
              </label>
              <Input
                id="cms-search"
                name="search"
                type="search"
                defaultValue={filters.search ?? ""}
                placeholder={`Search ${resource.searchFields.join(", ")}`}
              />
            </div>
          ) : null}

          {hasPublication ? (
            <div>
              <label htmlFor="cms-status" className="text-xs font-medium text-slate-700">
                Status
              </label>
              <Select id="cms-status" name="status" defaultValue={filters.status ?? ""}>
                <option value="">All</option>
                {resource.publication === "active" ? (
                  <>
                    <option value="true">Published</option>
                    <option value="false">Hidden</option>
                  </>
                ) : (
                  <>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </>
                )}
              </Select>
            </div>
          ) : null}

          <Button type="submit" variant="secondary">
            Apply
          </Button>

          {hasFilters ? (
            <Link
              href={`/cms/${key}`}
              className="rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title={hasFilters ? `No ${resource.label.toLowerCase()} match` : `No ${resource.label.toLowerCase()} yet`}
            description={
              hasFilters
                ? "Try clearing the filters."
                : `Create the first ${resource.singular.toLowerCase()} to get started.`
            }
            action={
              canWrite && !hasFilters ? (
                <ButtonLink href={`/cms/${key}/new`}>
                  New {resource.singular.toLowerCase()}
                </ButtonLink>
              ) : null
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>{resource.singular}</Th>
                {resource.slugField ? <Th>Slug</Th> : null}
                {hasPublication ? <Th>Status</Th> : null}
                <Th>Order</Th>
                <Th>Updated</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = String(row.id);
                const published =
                  resource.publication === "active"
                    ? row[resource.publicationField ?? ""] === true
                    : row[resource.publicationField ?? ""] === "PUBLISHED";

                return (
                  <tr key={id} className="hover:bg-slate-50">
                    <Td className="font-medium text-slate-900">
                      <Link href={`/cms/${key}/${id}`} className="hover:text-teal-700 hover:underline">
                        {text(row[resource.titleField]) === "—"
                          ? text((row.project as Row)?.title)
                          : text(row[resource.titleField])}
                      </Link>
                    </Td>

                    {resource.slugField ? (
                      <Td className="font-mono text-xs">{text(row[resource.slugField])}</Td>
                    ) : null}

                    {hasPublication ? (
                      <Td>
                        <Badge tone={published ? "green" : "neutral"}>
                          {published ? "Published" : resource.publication === "active" ? "Hidden" : text(row[resource.publicationField ?? ""])}
                        </Badge>
                      </Td>
                    ) : null}

                    <Td className="tabular-nums">{text(row.order)}</Td>

                    <Td className="text-xs tabular-nums text-slate-500">
                      {formatDate(row.updatedAt as string | undefined)}
                    </Td>

                    <Td className="text-right">
                      <Link
                        href={`/cms/${key}/${id}`}
                        className="text-sm text-teal-700 hover:underline"
                      >
                        {canWrite ? "Edit" : "View"}
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}

        {result.pagination && result.pagination.totalPages > 1 ? (
          <Pagination
            pagination={result.pagination}
            basePath={`/cms/${key}`}
            params={{ search: filters.search, status: filters.status }}
          />
        ) : null}
      </Card>
    </>
  );
}
