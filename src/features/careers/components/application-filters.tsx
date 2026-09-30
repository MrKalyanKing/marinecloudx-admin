import Link from "next/link";

import { ApplicationStatus } from "@/contracts";
import { applicationStatusLabel } from "@/features/careers/components/display";
import type { JobListItem } from "@/features/careers/types/careers";
import { Button, Input, Select } from "@/shared/components/primitives";

export function ApplicationFilters({
  jobs,
  values,
}: {
  jobs: JobListItem[];
  values: {
    search?: string;
    jobId?: string;
    status?: string;
    location?: string;
    experience?: string;
    skill?: string;
    applied?: string;
    pageSize?: string;
  };
}) {
  return (
    <form method="get" action="/careers/applications" className="border-b border-slate-200 px-4 py-3">
      <input type="hidden" name="page" value="1" />
      {values.pageSize ? <input type="hidden" name="pageSize" value={values.pageSize} /> : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label htmlFor="app-search" className="sr-only">
            Search candidates
          </label>
          <Input
            id="app-search"
            name="search"
            type="search"
            defaultValue={values.search ?? ""}
            placeholder="Search candidates…"
          />
        </div>

        <div>
          <label htmlFor="app-job" className="sr-only">
            Job
          </label>
          <Select id="app-job" name="jobId" defaultValue={values.jobId ?? ""}>
            <option value="">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="app-status" className="sr-only">
            Status
          </label>
          <Select id="app-status" name="status" defaultValue={values.status ?? ""}>
            <option value="">All</option>
            {Object.values(ApplicationStatus).map((status) => (
              <option key={status} value={status}>
                {applicationStatusLabel(status)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="app-experience" className="sr-only">
            Experience
          </label>
          <Select id="app-experience" name="experience" defaultValue={values.experience ?? ""}>
            <option value="">Experience: All</option>
            <option value="0">0–1 years</option>
            <option value="1">1–3 years</option>
            <option value="3">3–5 years</option>
            <option value="5">5+ years</option>
          </Select>
        </div>

        <div>
          <label htmlFor="app-applied" className="sr-only">
            Applied date
          </label>
          <Select id="app-applied" name="applied" defaultValue={values.applied ?? ""}>
            <option value="">Applied: Any time</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </Select>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label htmlFor="app-location" className="sr-only">
            Location
          </label>
          <Input
            id="app-location"
            name="location"
            defaultValue={values.location ?? ""}
            placeholder="Location"
          />
        </div>
        <div>
          <label htmlFor="app-skill" className="sr-only">
            Skills
          </label>
          <Input
            id="app-skill"
            name="skill"
            defaultValue={values.skill ?? ""}
            placeholder="Skill (e.g. Node.js)"
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
          <Link
            href="/careers/applications"
            className="rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            Clear
          </Link>
        </div>
      </div>
    </form>
  );
}
