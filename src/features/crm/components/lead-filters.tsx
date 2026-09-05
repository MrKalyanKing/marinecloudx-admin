import Link from "next/link";

import { Button, Input, Select } from "@/shared/components/primitives";
import { LeadStatus } from "@/contracts";
import type { CrmConfig } from "@/features/crm/types/crm";

/**
 * Lead search and filters.
 *
 * A plain GET form, deliberately: filtering happens on the server through the
 * API, the resulting URL is shareable and bookmarkable, and the whole thing
 * works without JavaScript. No client component is needed.
 *
 * `page` resets to 1 on every filter change — staying on page 7 of a result set
 * that no longer has 7 pages would show an empty table.
 */
export function LeadFilters({
  config,
  values,
}: {
  config: CrmConfig | null;
  values: {
    search?: string;
    status?: string;
    pipelineStageId?: string;
    sourceId?: string;
    assignedUserId?: string;
    serviceId?: string;
    pageSize?: string;
  };
}) {
  return (
    <form method="get" action="/crm/leads" className="border-b border-slate-200 px-4 py-3">
      <input type="hidden" name="page" value="1" />
      {values.pageSize ? <input type="hidden" name="pageSize" value={values.pageSize} /> : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label htmlFor="lead-search" className="sr-only">
            Search leads
          </label>
          <Input
            id="lead-search"
            name="search"
            type="search"
            defaultValue={values.search ?? ""}
            placeholder="Search name, email, phone, company"
          />
        </div>

        <div>
          <label htmlFor="lead-status" className="sr-only">
            Status
          </label>
          <Select id="lead-status" name="status" defaultValue={values.status ?? ""}>
            <option value="">All statuses</option>
            {Object.values(LeadStatus).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="lead-stage" className="sr-only">
            Pipeline stage
          </label>
          {/* Stages are configurable rows — read from the API, never hardcoded. */}
          <Select id="lead-stage" name="pipelineStageId" defaultValue={values.pipelineStageId ?? ""}>
            <option value="">All stages</option>
            {config?.pipelineStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="lead-source" className="sr-only">
            Source
          </label>
          <Select id="lead-source" name="sourceId" defaultValue={values.sourceId ?? ""}>
            <option value="">All sources</option>
            {config?.sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="lead-assignee" className="sr-only">
            Assigned to
          </label>
          <Select id="lead-assignee" name="assignedUserId" defaultValue={values.assignedUserId ?? ""}>
            <option value="">Anyone</option>
            <option value="unassigned">Unassigned</option>
            {config?.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Button type="submit" variant="secondary">
          Apply filters
        </Button>
        <Link
          href="/crm/leads"
          className="rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}
