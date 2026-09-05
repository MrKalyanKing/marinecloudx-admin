import Link from "next/link";

import { PageHeader } from "@/shared/components/admin/page-header";
import { Card, CardHeader, ErrorState } from "@/shared/components/primitives";
import { adminApiGet } from "@/lib/api/admin-api";

interface SummaryRow {
  key: string;
  label: string;
  publication: string;
  total: number;
  published: number | null;
  draft: number | null;
}

export default async function CmsDashboardPage() {
  const result = await adminApiGet<SummaryRow[]>("/api/admin/cms/summary");

  const header = (
    <PageHeader
      title="Content"
      description="Manage everything the public website will read from the database."
      breadcrumbs={[{ label: "CMS" }]}
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

  return (
    <>
      {header}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.map((row) => (
          <Card key={row.key}>
            <CardHeader
              title={
                <Link href={`/cms/${row.key}`} className="hover:text-teal-700 hover:underline">
                  {row.label}
                </Link>
              }
            />
            <div className="flex items-baseline gap-4 px-4 py-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums text-slate-900">{row.total}</p>
                <p className="text-xs text-slate-500">total</p>
              </div>

              {/* Taxonomy resources have no published state — showing a
                  published/draft split for them would be meaningless. */}
              {row.published !== null ? (
                <>
                  <div>
                    <p className="text-lg font-medium tabular-nums text-teal-700">{row.published}</p>
                    <p className="text-xs text-slate-500">published</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium tabular-nums text-slate-600">{row.draft}</p>
                    <p className="text-xs text-slate-500">draft</p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500">always live</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
