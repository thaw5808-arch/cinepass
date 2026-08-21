"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FoodCategory } from "@prisma/client";
import {
  createFoodItemAction,
  updateFoodItemAction,
  type FoodItemFormState,
} from "@/lib/actions/food";

const CATEGORY_LABEL: Record<FoodCategory, string> = {
  POPCORN: "Popcorn",
  DRINKS: "Drinks",
  SNACKS: "Snacks",
  COMBOS: "Combos",
  HOT_FOOD: "Hot Food",
};

export type FoodItemFormDefaults = {
  name: string;
  category: FoodCategory;
  price: number | "";
  imageUrl: string;
  available: boolean;
};

const BLANK_DEFAULTS: FoodItemFormDefaults = {
  name: "",
  category: "POPCORN",
  price: "",
  imageUrl: "",
  available: true,
};

export function FoodItemForm({
  mode,
  foodItemId,
  defaultValues,
}: {
  mode: "create" | "edit";
  foodItemId?: string;
  defaultValues?: FoodItemFormDefaults;
}) {
  const action = mode === "create" ? createFoodItemAction : updateFoodItemAction;
  const [state, formAction, pending] = useActionState<FoodItemFormState, FormData>(action, undefined);
  const values = defaultValues ?? BLANK_DEFAULTS;

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {mode === "edit" && foodItemId && <input type="hidden" name="foodItemId" value={foodItemId} />}

      <Field label="Name" htmlFor="name" errors={state?.errors?.name}>
        <input id="name" name="name" defaultValue={values.name} required className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" htmlFor="category" errors={state?.errors?.category}>
          <select id="category" name="category" defaultValue={values.category} className={inputClass}>
            {Object.values(FoodCategory).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Price (฿)" htmlFor="price" errors={state?.errors?.price}>
          <input
            id="price"
            name="price"
            type="number"
            min={0.01}
            step="0.01"
            defaultValue={values.price}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Image URL"
        htmlFor="imageUrl"
        hint="Optional — must be on a domain allowed by next.config.ts (images.unsplash.com works out of the box)"
        errors={state?.errors?.imageUrl}
      >
        <input id="imageUrl" name="imageUrl" type="url" defaultValue={values.imageUrl} className={inputClass} />
      </Field>

      <label htmlFor="available" className="flex items-center gap-2.5 text-sm text-text-primary">
        <input
          id="available"
          name="available"
          type="checkbox"
          defaultChecked={values.available}
          className="h-4 w-4 rounded border-border accent-marquee-gold"
        />
        Available for ordering
      </label>

      {state?.message && <p className="text-sm text-velvet-red-bright">{state.message}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-marquee-gold px-5 py-2.5 text-sm font-semibold text-bg hover:brightness-110 transition disabled:opacity-60"
        >
          {pending ? "Saving…" : mode === "create" ? "Add Item" : "Save Changes"}
        </button>
        <Link
          href="/admin/food-beverage"
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
