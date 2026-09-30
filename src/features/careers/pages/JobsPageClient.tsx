"use client";

import Link from "next/link";

import {
  JobStatusBadge,
  employmentTypeLabel,
  formatDate,
} from "@/features/careers/components/display";
import { JobFormDialog } from "@/features/careers/components/job-form-dialog";
import {
  CreateJobButton,
  JobsCreateJobShell,
} from "@/features/careers/components/jobs-create-job-shell";
import { JobStatusActions } from "@/features/careers/components/job-status-actions";
import type { JobListItem } from "@/features/careers/types/careers";
import { PageHeader } from "@/shared/components/admin/page-header";
import { Pagination } from "@/shared/components/pagination";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  TableWrap,
  Td,
  Th,
} from "@/shared/components/primitives";
import { JobStatus } from "@/contracts";
import type { ApiPagination } from "@/shared/types/api";
import { formatNumber } from "@/shared/utils/format";

export function JobsPageClient({
  jobs,
  pagination,
  query,
  canWrite,
  hasFilters,
}: {
  jobs: JobListItem[];
  pagination: ApiPagination | undefined;
  query: { search?: string; status?: string; pageSize?: string };
  canWrite: boolean;
  hasFilters: boolean;
}) {
  if (!canWrite) {
    return (
      <JobsPageBody
        jobs={jobs}
        pagination={pagination}
        query={query}
        canWrite={false}
        hasFilters={hasFilters}
        headerActions={null}
        emptyAction={
          hasFilters ? (
            <Link href="/careers/jobs" className="text-sm text-teal-700 hover:underline">
              Clear filters
            </Link>
          ) : null
        }
      />
    );
  }

  return (
    <JobsCreateJobShell>
      {(open) => (
        <JobsPageBody
          jobs={jobs}
          pagination={pagination}
          query={query}
          canWrite
          hasFilters={hasFilters}
          headerActions={<CreateJobButton onOpen={open} />}
          emptyAction={
            hasFilters ? (
              <Link href="/careers/jobs" className="text-sm text-teal-700 hover:underline">
                Clear filters
              </Link>
            ) : (
              <CreateJobButton onOpen={open} />
            )
          }
        />
      )}
    </JobsCreateJobShell>
  );
}

function JobsPageBody({
  jobs,
  pagination,
  query,
  canWrite,
  hasFilters,
  headerActions,
  emptyAction,
}: {
  jobs: JobListItem[];
  pagination: ApiPagination | undefined;
  query: { search?: string; status?: string; pageSize?: string };
  canWrite: boolean;
  hasFilters: boolean;
  headerActions: React.ReactNode;
  emptyAction: React.ReactNode;
}) {
  return (
    <>
      <PageHeader
        title="Jobs"
        description="Create and publish open positions for the careers page."
        breadcrumbs={[{ label: "Careers" }, { label: "Jobs" }]}
        actions={headerActions}
      />

      <Card>
        <form method="get" action="/careers/jobs" className="border-b border-white/40 px-4 py-3">
          <input type="hidden" name="page" value="1" />
          <div className="flex flex-wrap items-center gap-2">
            <Input
              name="search"
              type="search"
              placeholder="Search jobs…"
              defaultValue={query.search ?? ""}
              className="max-w-xs"
              aria-label="Search jobs"
            />
            <Select
              name="status"
              defaultValue={query.status ?? ""}
              aria-label="Status"
              className="w-auto"
            >
              <option value="">All statuses</option>
              {Object.values(JobStatus).map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
            {hasFilters ? (
              <Link href="/careers/jobs" className="text-sm text-slate-600 hover:underline">
                Clear
              </Link>
            ) : null}
          </div>
        </form>

        {jobs.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No jobs match these filters" : "No jobs yet"}
            description={
              hasFilters
                ? "Try clearing filters or widening your search."
                : "Create a job posting to start receiving applications."
            }
            action={emptyAction}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Position</Th>
                <Th>Department</Th>
                <Th>Location</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th className="text-right">Applications</Th>
                <Th>Updated</Th>
                {canWrite ? <Th>Actions</Th> : null}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-white/35">
                  <Td>
                    <p className="font-medium text-slate-900">{job.title}</p>
                    <p className="font-mono text-xs text-slate-500">{job.jobCode}</p>
                    {job.experience ? (
                      <p className="text-xs text-slate-500">{job.experience}</p>
                    ) : null}
                  </Td>
                  <Td>{job.department ?? "—"}</Td>
                  <Td>{job.location ?? "—"}</Td>
                  <Td>{employmentTypeLabel(job.employmentType)}</Td>
                  <Td>
                    {canWrite ? (
                      <JobStatusActions jobId={job.id} currentStatus={job.status} />
                    ) : (
                      <JobStatusBadge status={job.status} />
                    )}
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/careers/applications?jobId=${job.id}`}
                      className="font-medium tabular-nums text-teal-700 hover:underline"
                    >
                      {formatNumber(job.applicationCount)}
                    </Link>
                  </Td>
                  <Td className="tabular-nums text-slate-600">{formatDate(job.updatedAt)}</Td>
                  {canWrite ? (
                    <Td>
                      <JobFormDialog mode="edit" job={job} triggerLabel="Edit" />
                    </Td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}

        {pagination ? (
          <Pagination
            pagination={pagination}
            basePath="/careers/jobs"
            params={{ search: query.search, status: query.status }}
          />
        ) : null}
      </Card>
    </>
  );
}
