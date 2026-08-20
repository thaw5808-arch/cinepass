"use client";

import { useActionState } from "react";
import { register, type AuthFormState } from "@/lib/actions/auth";

export function RegisterForm({ returnTo }: { returnTo?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(register, undefined);

  return (
    <form action={action} className="space-y-5">
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1.5">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="w-full rounded-md border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-marquee-gold-dim"
        />
        {state?.errors?.name?.map((e) => (
          <p key={e} className="mt-1.5 text-xs text-velvet-red-bright">
            {e}
          </p>
        ))}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-marquee-gold-dim"
        />
        {state?.errors?.email?.map((e) => (
          <p key={e} className="mt-1.5 text-xs text-velvet-red-bright">
            {e}
          </p>
        ))}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1.5">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-md border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-marquee-gold-dim"
        />
        <p className="mt-1.5 text-xs text-text-muted">At least 8 characters.</p>
        {state?.errors?.password?.map((e) => (
          <p key={e} className="mt-1.5 text-xs text-velvet-red-bright">
            {e}
          </p>
        ))}
      </div>

      {state?.message && <p className="text-sm text-velvet-red-bright">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-marquee-gold px-4 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
