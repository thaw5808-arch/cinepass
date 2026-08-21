"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { ScreenType } from "@prisma/client";
import { createScreenAction, updateScreenAction, type ScreenFormState } from "@/lib/actions/screens";

// Plain string values, not Object.values(ScreenType) — ScreenType is only
// imported as a type above. Prisma enums are real runtime objects backed by
// the generated client, so a value import of one drags Prisma's whole
// server-only chain into the client bundle (same fix as lib/food.ts).
const SCREEN_TYPES: ScreenType[] = ["STANDARD", "IMAX", "VIP", "FOUR_DX", "DOLBY_ATMOS"];

const TYPE_LABEL: Record<ScreenType, string> = {
  STANDARD: "Standard",
  IMAX: "IMAX",
  VIP: "VIP",
  FOUR_DX: "4DX",
  DOLBY_ATMOS: "Dolby Atmos",
};

export type ScreenFormDefaults = {
  cinemaId: string;
  name: string;
  type: ScreenType;
  capacity: number | "";
};

const BLANK_DEFAULTS: ScreenFormDefaults = {
  cinemaId: "",
  name: "",
  type: "STANDARD",
  capacity: "",
};

export function ScreenForm({
  mode,
  screenId,
  cinemas,
  defaultValues,
}: {
  mode: "create" | "edit";
  screenId?: string;
  cinemas: { id: string; name: string }[];
  defaultValues?: ScreenFormDefaults;
}) {
  const action = mode === "create" ? createScreenAction : updateScreenAction;
  const [state, formAction, pending] = useActionState<ScreenFormState, FormData>(action, undefined);
  const values = defaultValues ?? BLANK_DEFAULTS;

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {mode === "edit" && screenId && <input type="hidden" name="screenId" value={screenId} />}

      <Field label="Cinema" htmlFor="cinemaId" errors={state?.errors?.cinemaId}>
        {cinemas.length === 0 ? (
          <p className="text-sm text-text-muted">
            No cinemas yet —{" "}
            <Link href="/admin/cinemas/new" className="text-marquee-gold hover:underline">
              add one first
            </Link>
            .
          </p>
        ) : (
          <select id="cinemaId" name="cinemaId" defaultValue={values.cinemaId} required className={inputClass}>
            <option value="" disabled>
              Choose a cinema
            </option>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Screen Name" htmlFor="name" errors={state?.errors?.name}>
        <input id="name" name="name" placeholder="Screen 1" defaultValue={values.name} required className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Type" htmlFor="type" errors={state?.errors?.type}>
          <select id="type" name="type" defaultValue={values.type} className={inputClass}>
            {SCREEN_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Capacity" htmlFor="capacity" errors={state?.errors?.capacity}>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            defaultValue={values.capacity}
            required
            className={inputClass}
          />
        </Field>
      </div>

      {state?.message && <p className="text-sm text-velvet-red-bright">{state.message}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending || cinemas.length === 0}
          className="rounded-md bg-marquee-gold px-5 py-2.5 text-sm font-semibold text-bg hover:brightness-110 transition disabled:opacity-60"
        >
          {pending ? "Saving…" : mode === "create" ? "Add Screen" : "Save Changes"}
        </button>
        <Link
          href="/admin/screens"
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
  errors,
  children,
}: {
  label: string;
  htmlFor: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-text-primary mb-1.5">
        {label}
      </label>
      {children}
      {errors?.map((e) => (
        <p key={e} className="mt-1.5 text-xs text-velvet-red-bright">
          {e}
        </p>
      ))}
    </div>
  );
}
