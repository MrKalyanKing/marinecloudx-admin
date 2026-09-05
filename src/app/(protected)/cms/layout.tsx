import { CAPABILITIES } from "@/contracts";
import { ErrorState } from "@/shared/components/primitives";
import { getSession, hasCapability } from "@/lib/auth";

/**
 * Section guard for the whole CMS — mirrors the CRM one. Every CMS backend
 * route enforces `cms:read` independently, so this is convenience, not the
 * boundary.
 */

export const dynamic = "force-dynamic";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!hasCapability(session, CAPABILITIES.CMS_READ)) {
    return (
      <ErrorState code="FORBIDDEN" message="Your role does not have access to the CMS." />
    );
  }

  return <>{children}</>;
}
