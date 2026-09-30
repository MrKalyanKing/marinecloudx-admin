import Link from "next/link";

import { ApplicationFilters } from "@/features/careers/components/application-filters";
import { ApplicationsTable } from "@/features/careers/components/applications-table";
import type {
  ApplicationListItem,
  CareersDashboard,
  JobListItem,
} from "@/features/careers/types/careers";
import { PageHeader } from "@/shared/components/admin/page-header";
import { Pagination } from "@/shared/components/pagination";
import {
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  StatTile,
} from "@/shared/components/primitives";
import { CAPABILITIES } from "@/contracts";
import { adminApiGet, toQueryString } from "@/lib/api/admin-api";
import { getSession } from "@/lib/auth";
import { formatNumber } from "@/shared/utils/format";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function experienceBounds(bucket?: string): {
  minExperience?: string;
  maxExperience?: string;
} {
  switch (bucket) {
    case "0":
      return { minExperience: "0", maxExperience: "1" };
    case "1":
      return { minExperience: "1", maxExperience: "3" };
    case "3":
      return { minExperience: "3", maxExperience: "5" };
    case "5":
      return { minExperience: "5" };
    default:
      return {};
  }
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getSession();
  const canWrite =
    Boolean(session) && session!.capabilities.includes(CAPABILITIES.CAREERS_WRITE);

  const experience = first(params.experience);
  const bounds = experienceBounds(experience);

  const query = {
    page: first(params.page),
    pageSize: first(params.pageSize) ?? "20",
    search: first(params.search),
    jobId: first(params.jobId),
    status: first(params.status),
    location: first(params.location),
    skill: first(params.skill),
    applied: first(params.applied),
    ...bounds,
  };

  const [appsResult, dashResult, jobsResult] = await Promise.all([
    adminApiGet<ApplicationListItem[]>(
      `/api/admin/careers/applications${toQueryString(query)}`,
    ),
    adminApiGet<CareersDashboard>(
      `/api/admin/careers/dashboard${toQueryString({ jobId: query.jobId })}`,
    ),
    adminApiGet<JobListItem[]>(
      `/api/admin/careers/jobs${toQueryString({ pageSize: "100" })}`,
    ),
  ]);

  const jobs = jobsResult.ok ? jobsResult.data : [];
  const selectedJob = query.jobId
    ? jobs.find((j) => j.id === query.jobId) ?? null
    : null;

  const header = (
    <PageHeader
      title={selectedJob ? selectedJob.title : "Applications"}
      description={
        selectedJob
          ? `Candidates who applied for ${selectedJob.title}.`
          : "Review and manage candidates across all open roles."
      }
      breadcrumbs={[
        { label: "Careers", href: "/careers/jobs" },
        { label: "Applications" },
      ]}
      actions={
        <ButtonLink href="/careers/jobs" variant="secondary">
          View Open Positions
        </ButtonLink>
      }
    />
  );

  if (!appsResult.ok) {
    return (
      <>
        {header}
        <ErrorState code={appsResult.code} message={appsResult.message} />
      </>
    );
  }

  const applications = appsResult.data;
  const pagination = appsResult.pagination;
  const dash = dashResult.ok ? dashResult.data : null;
  const hasFilters = Boolean(
    query.search ??
      query.jobId ??
      query.status ??
      query.location ??
      query.skill ??
      query.applied ??
      experience,
  );

  return (
    <>
      {header}

      {dash ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatTile label="Total Applications" value={formatNumber(dash.total)} />
          <StatTile label="New Applications" value={formatNumber(dash.new)} tone="positive" />
          <StatTile label="Under Review" value={formatNumber(dash.underReview)} tone="warning" />
          <StatTile label="Shortlisted" value={formatNumber(dash.shortlisted)} />
          <StatTile label="Interviews" value={formatNumber(dash.interview)} />
          <StatTile label="Selected" value={formatNumber(dash.selected)} tone="positive" />
        </div>
      ) : null}

      <Card>
        <ApplicationFilters
          jobs={jobs}
          values={{
            search: query.search,
            jobId: query.jobId,
            status: query.status,
            location: query.location,
            experience,
            skill: query.skill,
            applied: query.applied,
            pageSize: query.pageSize,
          }}
        />

        {applications.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No applications match these filters" : "No applications yet"}
            description={
              hasFilters
                ? "Try clearing the filters or widening your search."
                : "Applications from your careers page will appear here."
            }
            action={
              hasFilters ? (
                <Link href="/careers/applications" className="text-sm text-teal-700 hover:underline">
                  Clear filters
                </Link>
              ) : (
                <ButtonLink href="/careers/jobs" variant="secondary">
                  View Open Positions
                </ButtonLink>
              )
            }
          />
        ) : (
          <ApplicationsTable
            applications={applications}
            canWrite={canWrite}
            nowIso={new Date().toISOString()}
          />
        )}

        {pagination ? (
          <Pagination
            pagination={pagination}
            basePath="/careers/applications"
            params={{
              search: query.search,
              jobId: query.jobId,
              status: query.status,
              location: query.location,
              experience,
              skill: query.skill,
              applied: query.applied,
            }}
          />
        ) : null}
      </Card>
    </>
  );
}
