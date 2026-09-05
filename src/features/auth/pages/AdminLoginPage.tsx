import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/login-form";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  // `absolute` opts out of the root "%s — MarineCloudeX" template, which would
  // otherwise render "Sign in — MarineCloudeX Admin — MarineCloudeX".
  title: { absolute: "Sign in — MarineCloudeX Admin" },
  /** Internal tooling must never be indexed. */
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-4 py-10">
      {/* Decorative aurora wash. Purely presentational, hidden from assistive tech. */}
      <div aria-hidden="true" className="aurora" data-variant="wide" />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="text-2xl font-semibold tracking-[-0.02em] text-white">
            MarineCloude<span className="text-aurora">X</span>
          </span>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-300">
            Admin
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="mb-5">
            <h1 className="text-base font-semibold text-slate-900">Sign in</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Internal access only. Contact an administrator if you need an account.
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          MarineCloudeX internal tooling · authorised use only
        </p>
      </div>
    </main>
  );
}
