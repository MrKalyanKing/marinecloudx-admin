import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/actions";
import { AdminShell } from "@/shared/components/admin/admin-shell";
import { visibleSections } from "@/shared/components/admin/navigation";
import { getSession } from "@/lib/auth";

/**
 * The gate for every admin route.
 *
 * A server component, so the check runs before any markup is produced — there
 * is no client-side guard to bypass and no protected data reaches an
 * unauthorized browser. Navigation is filtered from the caller's real
 * capabilities (a convenience — every backend endpoint enforces the same
 * capability independently). `/login` sits outside this route group, so the
 * sign-in page never triggers a redirect loop.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "MarineCloudeX Admin" },
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Authenticated but the role grants nothing. Shown rather than redirected:
  // bouncing them to a login page they have already passed would be a loop.
  if (session.capabilities.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-3 p-6">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="text-sm text-slate-600">
          Your account does not have permission to use the admin area. Contact an
          administrator if you believe this is a mistake.
        </p>
      </main>
    );
  }

  return (
    <AdminShell
      sections={visibleSections(session.capabilities)}
      identity={{
        name: session.name,
        email: session.email,
        roleName: session.roleSlug,
      }}
      signOutAction={signOutAction}
    >
      {children}
    </AdminShell>
  );
}
