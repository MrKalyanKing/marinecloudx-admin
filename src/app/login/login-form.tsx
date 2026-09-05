"use client";

/**
 * Sign-in form.
 *
 * Reuses the shared admin primitives so the controls match the rest of the
 * interface rather than being one-off styles that drift.
 */

import { useActionState } from "react";

import type { LoginFormState } from "@/app/actions";
import { signInAction } from "@/app/actions";
import { Button, Field, Input } from "@/shared/components/primitives";

const INITIAL_STATE: LoginFormState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          >
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 4a.9.9 0 01.9.9v4a.9.9 0 01-1.8 0v-4A.9.9 0 0110 6zm0 8.4a1.1 1.1 0 110-2.2 1.1 1.1 0 010 2.2z" />
          </svg>
          {state.error}
        </p>
      ) : null}

      <fieldset disabled={isPending} className="flex flex-col gap-4">
        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            required
            placeholder="you@marinecloudex.com"
          />
        </Field>

        <Field label="Password" htmlFor="password" required>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
          />
        </Field>
      </fieldset>

      <Button type="submit" disabled={isPending} className="w-full py-2">
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
