"use client";

/**
 * Admin application shell: sidebar, header and content area.
 *
 * A client component only because the mobile drawer and the active-link state
 * need interactivity. It receives already-filtered navigation and an identity
 * summary as props — it performs no capability logic and fetches nothing.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { NavSection } from "@/shared/components/admin/navigation";
import { cn } from "@/shared/components/primitives";

export interface AdminIdentity {
  name: string;
  email: string;
  roleName: string;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  sections,
  pathname,
  onNavigate,
}: {
  sections: NavSection[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-5 px-3 py-4">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400/90">
            {section.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);

              if (item.comingSoon) {
                return (
                  <li key={item.label}>
                    <span
                      aria-disabled="true"
                      title="Coming in a later step"
                      className="flex cursor-not-allowed items-center justify-between rounded-xl px-2.5 py-1.5 text-sm text-slate-500"
                    >
                      {item.label}
                      <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-300">
                        Soon
                      </span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-xl px-2.5 py-1.5 text-sm transition-all",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400",
                      active
                        ? "bg-gradient-to-r from-teal-500/25 to-teal-400/10 font-medium text-teal-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-inset ring-teal-400/25"
                        : "text-slate-300 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  sections,
  identity,
  signOutAction,
  children,
}: {
  sections: NavSection[];
  identity: AdminIdentity;
  /** Server action — sign-out must not be a client-side token discard. */
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const brand = (
    <Link
      href="/"
      className="flex items-center gap-2 border-b border-white/10 px-4 py-3.5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
    >
      <span className="text-base font-semibold tracking-tight">
        MarineCloude<span className="text-aurora">X</span>
      </span>
      <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-200 ring-1 ring-inset ring-white/15">
        Admin
      </span>
    </Link>
  );

  return (
    <div className="admin-liquid-bg min-h-screen text-slate-900">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="liquid-glass-sidebar fixed inset-y-0 left-0 z-20 hidden w-60 flex-col lg:flex">
        {brand}
        <div className="flex-1 overflow-y-auto">
          <NavLinks sections={sections} pathname={pathname} />
        </div>
        <div className="border-t border-white/10 px-4 py-3">
          <p className="truncate text-xs text-slate-400">{identity.email}</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="liquid-glass-sidebar absolute inset-y-0 left-0 flex w-64 flex-col shadow-xl"
          >
            {brand}
            <div className="flex-1 overflow-y-auto">
              <NavLinks
                sections={sections}
                pathname={pathname}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <header className="liquid-glass-header sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="rounded-xl p-1.5 text-slate-600 ring-1 ring-inset ring-white/70 bg-white/40 hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-slate-900">{identity.name}</p>
              <p className="text-xs leading-tight text-slate-500">{identity.roleName}</p>
            </div>
            <div
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-800 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(20,184,166,0.8)] ring-2 ring-white/60"
            >
              {identity.name.charAt(0).toUpperCase()}
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-xl bg-white/45 px-2.5 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-inset ring-white/70 transition-colors hover:bg-white/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main id="admin-content" className="relative mx-auto max-w-[100rem] px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
