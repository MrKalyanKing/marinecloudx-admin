/**
 * Route entry for /admin/crm/pipeline.
 *
 * The page itself lives in the crm feature. This file exists because
 * Next.js resolves a route from a page.tsx at this path — it carries the
 * route's config and nothing else.
 */

export const dynamic = "force-dynamic";

export { default } from "@/features/crm/pages/PipelinePage";
