"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { DiscountType } from "@prisma/client";
import {
  createPromotionAction,
  updatePromotionAction,
  type PromotionFormState,
} from "@/lib/actions/promotions";

// Plain string values, not Object.values(DiscountType) — DiscountType is
// only imported as a type above. Prisma enums are real runtime objects
// backed by the generated client, so a value import of one drags Prisma's
// whole server-only chain into the client bundle (same fix as lib/food.ts).
const DISCOUNT_TYPES: DiscountType[] = ["PERCENTAGE", "FIXED_AMOUNT", "COMBO"];

const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  PERCENTAGE: "Percentage",
  FIXED_AMOUNT: "Fixed Amount",
  COMBO: "Combo Deal",
};

export type PromotionFormDefaults = {
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number | "";
  minSpend: number | "";
  // "yyyy-MM-ddTHH:mm", matching what a datetime-local input reads/writes.
  validFrom: string;
  validTo: string;
  active: boolean;
  usageLimit: number | "";
};

const BLANK_DEFAULTS: PromotionFormDefaults = {
  code: "",
  title: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minSpend: "",
  validFrom: "",
  validTo: "",
  active: true,
  usageLimit: "",
};

export function PromotionForm({
  mode,
  promotionId,
  defaultValues,
}: {
  mode: "create" | "edit";
  promotionId?: string;
  defaultValues?: PromotionFormDefaults;
}) {
  const action = mode === "create" ? createPromotionAction : updatePromotionAction;
  const [state, formAction, pending] = useActionState<PromotionFormState, FormData>(action, undefined);
  const values = defaultValues ?? BLANK_DEFAULTS;

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {mode === "edit" && promotionId && <input type="hidden" name="promotionId" value={promotionId} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Code" htmlFor="code" errors={state?.errors?.code}>
          <input
            id="code"
            name="code"
            defaultValue={values.code}
            required
            className={`${inputClass} font-mono uppercase`}
          />
        </Field>

        <Field label="Title" htmlFor="title" errors={state?.errors?.title}>
          <input id="title" name="title" defaultValue={values.title} required className={inputClass} />
        </Field>
      </div>

      <Field label="Description" htmlFor="description" errors={state?.errors?.description}>
        <textarea
          id="description"
          name="description"
          defaultValue={values.description}
          required
          rows={3}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Discount Type" htmlFor="discountType" errors={state?.errors?.discountType}>
          <select id="discountType" name="discountType" defaultValue={values.discountType} className={inputClass}>
            {DISCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {DISCOUNT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Discount Value"
          htmlFor="discountValue"
          hint="Percentage: 0–100. Fixed Amount / Combo: flat ฿ off."
          errors={state?.errors?.discountValue}
        >
          <input
            id="discountValue"
            name="discountValue"
            type="number"
            min={0.01}
            step="0.01"
            defaultValue={values.discountValue}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Minimum Spend (฿)"
        htmlFor="minSpend"
        hint="Optional — leave blank for no minimum"
        errors={state?.errors?.minSpend}
      >
        <input
          id="minSpend"
          name="minSpend"
          type="number"
          min={0}
          step="0.01"
          defaultValue={values.minSpend}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Valid From" htmlFor="validFrom" errors={state?.errors?.validFrom}>
          <input
            id="validFrom"
            name="validFrom"
            type="datetime-local"
            defaultValue={values.validFrom}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Valid To" htmlFor="validTo" errors={state?.errors?.validTo}>
          <input
            id="validTo"
            name="validTo"
            type="datetime-local"
            defaultValue={values.validTo}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Usage Limit"
        htmlFor="usageLimit"
        hint="Optional — leave blank for unlimited redemptions"
        errors={state?.errors?.usageLimit}
      >
        <input
          id="usageLimit"
          name="usageLimit"
          type="number"
          min={1}
          step={1}
          defaultValue={values.usageLimit}
          className={inputClass}
        />
      </Field>

      <label htmlFor="active" className="flex items-center gap-2.5 text-sm text-text-primary">
        <input
          id="active"
          name="active"
          type="checkbox"
          defaultChecked={values.active}
          className="h-4 w-4 rounded border-border accent-marquee-gold"
        />
        Active
      </label>

      {state?.message && <p className="text-sm text-velvet-red-bright">{state.message}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-marquee-gold px-5 py-2.5 text-sm font-semibold text-bg hover:brightness-110 transition disabled:opacity-60"
        >
          {pending ? "Saving…" : mode === "create" ? "Add Promotion" : "Save Changes"}
        </button>
        <Link
          href="/admin/promotions"
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
