"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileFormState } from "@/lib/actions/profile";

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "th", label: "ไทย (Thai)" },
  { value: "zh", label: "中文 (Chinese)" },
  { value: "ja", label: "日本語 (Japanese)" },
  { value: "ko", label: "한국어 (Korean)" },
];

export type ProfileFormDefaults = {
  name: string;
  phone: string;
  city: string;
  language: string;
};

export function ProfileForm({ defaultValues }: { defaultValues: ProfileFormDefaults }) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Name" htmlFor="name" errors={state?.errors?.name}>
        <input id="name" name="name" defaultValue={defaultValues.name} required className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" htmlFor="phone" hint="Optional" errors={state?.errors?.phone}>
          <input id="phone" name="phone" type="tel" defaultValue={defaultValues.phone} className={inputClass} />
        </Field>

        <Field label="City" htmlFor="city" hint="Optional" errors={state?.errors?.city}>
          <input id="city" name="city" defaultValue={defaultValues.city} className={inputClass} />
        </Field>
      </div>

      <Field label="Language" htmlFor="language" errors={state?.errors?.language}>
        <select id="language" name="language" defaultValue={defaultValues.language} className={inputClass}>
          {LANGUAGE_OPTIONS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </Field>

      {state?.message && <p className="text-sm text-velvet-red-bright">{state.message}</p>}
      {state?.success && <p className="text-sm text-marquee-gold">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-marquee-gold px-5 py-2.5 text-sm font-semibold text-bg hover:brightness-110 transition disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save Changes"}
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
