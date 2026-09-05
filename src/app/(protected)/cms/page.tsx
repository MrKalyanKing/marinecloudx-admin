/**
 * Route entry for /admin/cms.
 *
 * The page itself lives in the cms feature. This file exists because
 * Next.js resolves a route from a page.tsx at this path — it carries the
 * route's config and nothing else.
 */

export const dynamic = "force-dynamic";

export { default } from "@/features/cms/pages/CmsDashboardPage";
