import { Card, EmptyState } from "@/shared/components/primitives";
import { CAPABILITIES } from "@/contracts";
import { getSession, hasCapability } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CareersLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!hasCapability(session, CAPABILITIES.CAREERS_READ)) {
    return (
      <Card>
        <EmptyState
          title="No access to Careers"
          description="Your role does not include careers access. If you need it, ask an administrator to update your role."
        />
      </Card>
    );
  }

  return <>{children}</>;
}
