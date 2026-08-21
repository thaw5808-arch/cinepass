"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, type PasswordFormState } from "@/lib/actions/profile";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordFormState, FormData>(
    changePasswordAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear both fields after a successful change — an uncontrolled form
  // otherwise leaves whatever was typed sitting in the inputs.
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="max-w-md space-y-5">
      <Field label="Current Password" htmlFor="currentPassword" errors={state?.errors?.currentPassword}>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>

      <Field label="New Password" htmlFor="newPassword" hint="At least 8 characters." errors={state?.errors?.newPassword}>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </Field>

      {state?.message && <p className="text-sm text-velvet-red-bright">{state.message}</p>}
      {state?.success && <p className="text-sm text-marquee-gold">Password updated.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover:bg-bg-elevated transition disabled:opacity-60"
      >
        {pending ? "Updating…" : "Change Password"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-marquee-gold-dim";

function Field({
  label,
  htmlFor,
  hint,
  errors,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-text-primary mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
      {errors?.map((e) => (
        <p key={e} className="mt-1.5 text-xs text-velvet-red-bright">
          {e}
        </p>
      ))}
    </div>
  );
}
