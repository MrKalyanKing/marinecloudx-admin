"use client";

/**
 * Publish / unpublish control.
 *
 * Its own action, separate from saving, so content only goes live when someone
 * deliberately says so. Unpublishing is styled as a secondary action.
 */

import { Badge, Button } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";
import { formatDate, toIsoDate } from "@/shared/utils/format";

export function PublishToggle({
  resourceKey,
  id,
  isPublished,
  publishedAt,
}: {
  resourceKey: string;
  id: string;
  isPublished: boolean;
  publishedAt?: string | null;
}) {
  const { mutate, isPending, error } = useApiMutation();

  async function setPublished(published: boolean) {
    await mutate(`/api/admin/cms/${resourceKey}/${id}/publish`, {
      method: "PATCH",
      body: { published },
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={isPublished ? "green" : "neutral"}>{isPublished ? "Published" : "Draft"}</Badge>

      {publishedAt ? (
        <span className="text-xs text-slate-500">
          since <time dateTime={toIsoDate(publishedAt)}>{formatDate(publishedAt)}</time>
        </span>
      ) : null}

      {isPublished ? (
        <Button variant="secondary" disabled={isPending} onClick={() => void setPublished(false)}>
          {isPending ? "Working…" : "Unpublish"}
        </Button>
      ) : (
        <Button disabled={isPending} onClick={() => void setPublished(true)}>
          {isPending ? "Working…" : "Publish"}
        </Button>
      )}

      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
