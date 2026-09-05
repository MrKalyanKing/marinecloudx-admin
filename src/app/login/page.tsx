/**
 * Route entry for /admin/login.
 *
 * The page itself lives in the auth feature. This file exists because
 * Next.js resolves a route from a page.tsx at this path — it carries the
 * route's config and nothing else.
 */

export const dynamic = "force-dynamic";

export { metadata } from "@/features/auth/pages/AdminLoginPage";
export { default } from "@/features/auth/pages/AdminLoginPage";
