import { Card, Skeleton, TableSkeleton } from "@/shared/components/primitives";

/**
 * Shared admin loading state.
 *
 * Applies to every route in the group, so no admin screen ever renders a blank
 * page while its server component awaits data.
 */
export default function AdminLoading() {
  return (
    <div>
      <div className="mb-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-2 h-6 w-56" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-12" />
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <div className="border-b border-slate-200 px-4 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
        <TableSkeleton />
      </Card>
    </div>
  );
}
