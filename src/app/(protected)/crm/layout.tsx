import { Card, EmptyState } from "@/shared/components/primitives";
import { CAPABILITIES } from "@/contracts";
import { getSession, hasCapability } from "@/lib/auth";

/**
 * Capability gate for the whole CRM section — a usable message, not the
 * boundary. Every backend endpoint behind these pages enforces `crm:read`
 * independently.
 */

export const dynamic = "force-dynamic";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!hasCapability(session, CAPABILITIES.CRM_READ)) {
    return (
      <Card>
        <EmptyState
          title="No access to the CRM"
          description="Your role does not include CRM access. If you need it, ask an administrator to update your role."
        />
      </Card>
    );
  }

  return <>{children}</>;
}
