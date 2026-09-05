import Link from "next/link";

import { PipelineBoard } from "@/features/crm/components/pipeline-board";
import { PageHeader } from "@/shared/components/admin/page-header";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Select,
} from "@/shared/components/primitives";
import { adminApiGet, toQueryString } from "@/lib/api/admin-api";
import { Priority } from "@/contracts";
import { CAPABILITIES } from "@/contracts";
import { getSession } from "@/lib/auth";
import type { CrmConfig, PipelineBoardData } from "@/features/crm/types/crm";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PipelinePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getSession();
  const canWrite =
    Boolean(session) && session!.capabilities.includes(CAPABILITIES.CRM_WRITE);

  const query = {
    search: first(params.search),
    assignedUserId: first(params.assignedUserId),
    serviceId: first(params.serviceId),
    sourceId: first(params.sourceId),
    priority: first(params.priority),
  };

  const [boardResult, configResult] = await Promise.all([
    adminApiGet<PipelineBoardData>(`/api/admin/pipeline${toQueryString(query)}`),
    adminApiGet<CrmConfig>("/api/admin/crm/config"),
  ]);

  const config = configResult.ok ? configResult.data : null;

  const header = (
    <PageHeader
      title="Pipeline"
      description="Drag a card to move a lead, or use the stage selector on any card."
      breadcrumbs={[{ label: "CRM", href: "/crm" }, { label: "Pipeline" }]}
      actions={
        <Link href="/crm/leads" className="text-sm text-teal-700 hover:underline">
          Table view
        </Link>
      }
    />
  );

  if (!boardResult.ok) {
    return (
      <>
        {header}
        <ErrorState code={boardResult.code} message={boardResult.message} />
      </>
    );
  }

  const board = boardResult.data;
  const totalLeads = board.columns.reduce((sum, column) => sum + column.leadCount, 0);
  const hasFilters = Boolean(
    query.search ?? query.assignedUserId ?? query.serviceId ?? query.sourceId ?? query.priority,
  );

  return (
    <>
      {header}

      <Card className="mb-4">
        <form method="get" className="px-4 py-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label htmlFor="pipeline-search" className="sr-only">
                Search leads
              </label>
              <Input
                id="pipeline-search"
                name="search"
                type="search"
                defaultValue={query.search ?? ""}
                placeholder="Search name, email, phone, company"
              />
            </div>

            <div>
              <label htmlFor="pipeline-assignee" className="sr-only">
                Assigned to
              </label>
              <Select
                id="pipeline-assignee"
                name="assignedUserId"
                defaultValue={query.assignedUserId ?? ""}
              >
                <option value="">Anyone</option>
                <option value="unassigned">Unassigned</option>
                {config?.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="pipeline-service" className="sr-only">
                Service
              </label>
              <Select id="pipeline-service" name="serviceId" defaultValue={query.serviceId ?? ""}>
                <option value="">All services</option>
                {config?.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="pipeline-priority" className="sr-only">
                Priority
              </label>
              <Select id="pipeline-priority" name="priority" defaultValue={query.priority ?? ""}>
                <option value="">Any priority</option>
                {Object.values(Priority).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0) + priority.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Button type="submit" variant="secondary">
              Apply filters
            </Button>
            {hasFilters ? (
              <Link
                href="/crm/pipeline"
                className="rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </Card>

      {board.columns.length === 0 ? (
        <Card>
          <EmptyState
            title="No pipeline stages configured"
            description="Run the database seed to create the default stages."
          />
        </Card>
      ) : totalLeads === 0 ? (
        <Card>
          <EmptyState
            title={hasFilters ? "No leads match these filters" : "No leads in the pipeline yet"}
            description={
              hasFilters
                ? "Try clearing the filters."
                : "Leads captured from the website or created in the CRM will appear here."
            }
            action={
              hasFilters ? (
                <Link href="/crm/pipeline" className="text-sm text-teal-700 hover:underline">
                  Clear filters
                </Link>
              ) : null
            }
          />
        </Card>
      ) : (
        <PipelineBoard
          columns={board.columns}
          cardsPerStage={board.cardsPerStage}
          canWrite={canWrite}
        />
      )}
    </>
  );
}
