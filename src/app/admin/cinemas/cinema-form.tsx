"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createCinemaAction, updateCinemaAction, type CinemaFormState } from "@/lib/actions/cinemas";

export type CinemaFormDefaults = {
  name: string;
  address: string;
  city: string;
  latitude: number | "";
  longitude: number | "";
  formats: string; // comma-separated, e.g. "IMAX, VIP, Dolby Atmos"
};

const BLANK_DEFAULTS: CinemaFormDefaults = {
  name: "",
  address: "",
  city: "",
  latitude: "",
  longitude: "",
  formats: "",
};

export function CinemaForm({
  mode,
  cinemaId,
  defaultValues,
}: {
  mode: "create" | "edit";
  cinemaId?: string;
  defaultValues?: CinemaFormDefaults;
}) {
  const action = mode === "create" ? createCinemaAction : updateCinemaAction;
  const [state, formAction, pending] = useActionState<CinemaFormState, FormData>(action, undefined);
  const values = defaultValues ?? BLANK_DEFAULTS;

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {mode === "edit" && cinemaId && <input type="hidden" name="cinemaId" value={cinemaId} />}

      <Field label="Name" htmlFor="name" errors={state?.errors?.name}>
        <input id="name" name="name" defaultValue={values.name} required className={inputClass} />
      </Field>

      <Field label="Address" htmlFor="address" errors={state?.errors?.address}>
        <input id="address" name="address" defaultValue={values.address} required className={inputClass} />
      </Field>

      <Field label="City" htmlFor="city" errors={state?.errors?.city}>
        <input id="city" name="city" defaultValue={values.city} required className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Latitude" htmlFor="latitude" errors={state?.errors?.latitude}>
          <input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            defaultValue={values.latitude}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Longitude" htmlFor="longitude" errors={state?.errors?.longitude}>
          <input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            defaultValue={values.longitude}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Formats"
        htmlFor="formats"
        hint="Comma-separated, e.g. IMAX, VIP, Dolby Atmos"
        errors={state?.errors?.formats}
      >
        <input id="formats" name="formats" defaultValue={values.formats} required className={inputClass} />
      </Field>

      {state?.message && <p className="text-sm text-velvet-red-bright">{state.message}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-marquee-gold px-5 py-2.5 text-sm font-semibold text-bg hover:brightness-110 transition disabled:opacity-60"
        >
          {pending ? "Saving…" : mode === "create" ? "Add Cinema" : "Save Changes"}
        </button>
        <Link
          href="/admin/cinemas"
          className="rounded-md border border-border px-5 py-2.5 text-sm hover:bg-bg-elevated transition"
        >
          Cancel
        </Link>
      </div>
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
