import Link from "next/link";

import {
  DueBadge,
  PriorityBadge,
  TaskStatusBadge,
  contactName,
} from "@/features/crm/components/display";
import { CompleteTaskButton, CreateTaskForm } from "@/features/crm/components/task-actions";
import { PageHeader } from "@/shared/components/admin/page-header";
import { Pagination } from "@/shared/components/pagination";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Select,
  StatTile,
  TableWrap,
  Td,
  Th,
  Button,
} from "@/shared/components/primitives";
import { adminApiGet, toQueryString } from "@/lib/api/admin-api";
import { Priority, TaskStatus } from "@/contracts";
import { CAPABILITIES } from "@/contracts";
import { getSession } from "@/lib/auth";
import type { CrmConfig, DashboardData, TaskListItem } from "@/features/crm/types/crm";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getSession();
  const canWrite =
    Boolean(session) && session!.capabilities.includes(CAPABILITIES.CRM_WRITE);

  const query = {
    page: first(params.page),
    pageSize: first(params.pageSize),
    status: first(params.status),
    assignedUserId: first(params.assignedUserId),
    priority: first(params.priority),
    due: first(params.due),
  };

  const [tasksResult, configResult, dashboardResult] = await Promise.all([
    adminApiGet<TaskListItem[]>(`/api/admin/tasks${toQueryString(query)}`),
    adminApiGet<CrmConfig>("/api/admin/crm/config"),
    // Only for the true task totals in the header tiles.
    adminApiGet<DashboardData>("/api/admin/dashboard"),
  ]);

  const config = configResult.ok ? configResult.data : null;

  const header = (
    <PageHeader
      title="Tasks & follow-ups"
      description="Open work across the pipeline."
      breadcrumbs={[{ label: "CRM", href: "/crm" }, { label: "Tasks" }]}
    />
  );

  if (!tasksResult.ok) {
    return (
      <>
        {header}
        <ErrorState code={tasksResult.code} message={tasksResult.message} />
      </>
    );
  }

  const tasks = tasksResult.data;

  // Database-wide totals, computed server-side from dueAt against the current
  // time. These replaced the earlier page-only tallies, which could not be
  // trusted as totals.
  const taskTotals = dashboardResult.ok ? dashboardResult.data.tasks : null;

  return (
    <>
      {header}

      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Open" value={taskTotals?.open ?? "—"} />
        <StatTile label="Due today" value={taskTotals?.dueToday ?? "—"} tone="warning" />
        <StatTile
          label="Overdue"
          value={taskTotals?.overdue ?? "—"}
          tone={(taskTotals?.overdue ?? 0) > 0 ? "danger" : "default"}
        />
        <StatTile label="Matching filters" value={tasksResult.pagination?.total ?? 0} />
      </section>

      {canWrite && config ? (
        <Card className="mb-4">
          <CardHeader title="New follow-up" />
          <CreateTaskForm users={config.users} />
        </Card>
      ) : null}

      <Card>
        <form method="get" className="border-b border-slate-200 px-4 py-3">
          <input type="hidden" name="page" value="1" />
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-44">
              <label htmlFor="task-status-filter" className="text-xs font-medium text-slate-700">
                Status
              </label>
              <Select id="task-status-filter" name="status" defaultValue={query.status ?? ""}>
                <option value="">All statuses</option>
                {Object.values(TaskStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-48">
              <label htmlFor="task-assignee-filter" className="text-xs font-medium text-slate-700">
                Assigned to
              </label>
              <Select
                id="task-assignee-filter"
                name="assignedUserId"
                defaultValue={query.assignedUserId ?? ""}
              >
                <option value="">Anyone</option>
                {config?.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="task-priority-filter" className="text-xs font-medium text-slate-700">
                Priority
              </label>
              <Select
                id="task-priority-filter"
                name="priority"
                defaultValue={query.priority ?? ""}
              >
                <option value="">Any priority</option>
                {Object.values(Priority).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0) + priority.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="task-due-filter" className="text-xs font-medium text-slate-700">
                Due
              </label>
              {/* Server-side, computed from dueAt vs now — never a stored flag. */}
              <Select id="task-due-filter" name="due" defaultValue={query.due ?? ""}>
                <option value="">Any time</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due today</option>
                <option value="upcoming">Upcoming</option>
              </Select>
            </div>

            <Button type="submit" variant="secondary">
              Apply
            </Button>
            <Link
              href="/crm/tasks"
              className="rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Clear
            </Link>
          </div>
        </form>

        {tasks.length === 0 ? (
          <EmptyState
            title="No tasks match"
            description="Follow-ups created against a lead, or standalone, will appear here."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Task</Th>
                <Th>Lead</Th>
                <Th>Assigned</Th>
                <Th>Due</Th>
                <Th>Priority</Th>
                <Th>Status</Th>
                {canWrite ? <Th className="text-right">Action</Th> : null}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const isClosed = task.status === "COMPLETED" || task.status === "CANCELLED";

                return (
                  <tr key={task.id} className="hover:bg-slate-50">
                    <Td>
                      <span
                        className={
                          task.status === "COMPLETED"
                            ? "text-slate-500 line-through"
                            : "font-medium text-slate-900"
                        }
                      >
                        {task.title}
                      </span>
                    </Td>
                    <Td>
                      {task.lead ? (
                        <Link
                          href={`/crm/leads/${task.lead.id}`}
                          className="text-teal-700 hover:underline"
                        >
                          {contactName(task.lead.contact)}
                        </Link>
                      ) : (
                        <span className="text-slate-400">Standalone</span>
                      )}
                    </Td>
                    <Td>{task.assignedUser?.name ?? <span className="text-slate-400">—</span>}</Td>
                    <Td>
                      <DueBadge dueAt={task.dueAt} isClosed={isClosed} />
                    </Td>
                    <Td>
                      <PriorityBadge priority={task.priority} />
                    </Td>
                    <Td>
                      <TaskStatusBadge status={task.status} />
                    </Td>
                    {canWrite ? (
                      <Td className="text-right">
                        <CompleteTaskButton
                          taskId={task.id}
                          isCompleted={task.status === "COMPLETED"}
                        />
                      </Td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}

        {tasksResult.pagination ? (
          <Pagination
            pagination={tasksResult.pagination}
            basePath="/crm/tasks"
            params={{
              status: query.status,
              assignedUserId: query.assignedUserId,
              priority: query.priority,
              due: query.due,
            }}
          />
        ) : null}
      </Card>
    </>
  );
}
