import { JobsPageClient } from "@/features/careers/pages/JobsPageClient";
import type { JobListItem } from "@/features/careers/types/careers";
import { PageHeader } from "@/shared/components/admin/page-header";
import { ErrorState } from "@/shared/components/primitives";
import { CAPABILITIES } from "@/contracts";
import { adminApiGet, toQueryString } from "@/lib/api/admin-api";
import { getSession } from "@/lib/auth";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getSession();
  const canWrite =
    Boolean(session) && session!.capabilities.includes(CAPABILITIES.CAREERS_WRITE);

  const query = {
    page: first(params.page),
    pageSize: first(params.pageSize) ?? "20",
    search: first(params.search),
    status: first(params.status),
  };

  const result = await adminApiGet<JobListItem[]>(
    `/api/admin/careers/jobs${toQueryString(query)}`,
  );

  if (!result.ok) {
    return (
      <>
        <PageHeader
          title="Jobs"
          description="Create and publish open positions for the careers page."
          breadcrumbs={[{ label: "Careers" }, { label: "Jobs" }]}
        />
        <ErrorState code={result.code} message={result.message} />
      </>
    );
  }

  const hasFilters = Boolean(query.search ?? query.status);

  return (
    <JobsPageClient
      jobs={result.data}
      pagination={result.pagination}
      query={query}
      canWrite={canWrite}
      hasFilters={hasFilters}
    />
  );
}
