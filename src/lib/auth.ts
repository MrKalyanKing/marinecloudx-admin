import "server-only";

import { headers } from "next/headers";

import type { Capability } from "@/contracts";

/**
 * Admin session resolution.
 *
 * The backend owns authentication. This forwards the incoming request's session
 * cookie to `GET {API}/auth/session`, which re-reads the user, role and
 * capabilities from the database on every call. There is one identity path.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  roleSlug: string;
  capabilities: Capability[];
}

export async function getSession(): Promise<AdminSession | null> {
  const cookie = (await headers()).get("cookie") ?? "";
  try {
    const res = await fetch(`${API_URL}/auth/session`, {
      headers: { cookie, accept: "application/json" },
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as
      | { success: boolean; data: AdminSession }
      | null;
    return res.ok && body?.success ? body.data : null;
  } catch {
    return null;
  }
}

export function hasCapability(session: AdminSession | null, capability: Capability): boolean {
  return Boolean(session && session.capabilities.includes(capability));
}
