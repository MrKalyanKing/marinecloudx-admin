"use server";

/**
 * Admin authentication — server actions that talk to the NestJS backend.
 *
 * The backend owns auth. Login posts the credentials there; on success it
 * returns an httpOnly session cookie, which this action copies onto the admin
 * app's own response so the browser holds it. The password exists only inside
 * this process and is never logged.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "mcx_session";
const IS_PROD = process.env.NODE_ENV === "production";
const SESSION_TTL_SECONDS = Number(process.env.AUTH_SESSION_TTL ?? 8 * 60 * 60);

export interface LoginFormState {
  error: string | null;
}

/** Pulls the session token out of a backend `Set-Cookie` header. */
function extractSessionToken(setCookie: string | null): string | null {
  if (!setCookie) return null;
  const match = setCookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

export async function signInAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let ok = false;
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (res.ok) {
      const token = extractSessionToken(res.headers.get("set-cookie"));
      if (token) {
        (await cookies()).set(COOKIE_NAME, token, {
          httpOnly: true,
          sameSite: "lax",
          secure: IS_PROD,
          path: "/",
          maxAge: SESSION_TTL_SECONDS,
        });
        ok = true;
      }
    }
  } catch {
    return { error: "Could not reach the authentication service." };
  }

  // One message for every failure mode — never an account enumerator.
  if (!ok) return { error: "Invalid email or password." };

  redirect("/");
}

export async function signOutAction(): Promise<void> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: token ? { cookie: `${COOKIE_NAME}=${token}` } : {},
      cache: "no-store",
    });
    jar.delete(COOKIE_NAME);
  } catch {
    // Best effort — clearing the local cookie is what matters.
    (await cookies()).delete(COOKIE_NAME);
  }
  redirect("/login");
}
