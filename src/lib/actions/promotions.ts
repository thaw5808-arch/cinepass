"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { Prisma, DiscountType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isForeignKeyRestrictionError } from "@/lib/prisma-errors";
import { applyDiscount } from "@/lib/pricing";
import { validatePromoCode } from "@/lib/promotions";

export type PromotionFormState =
  | {
      errors?: Partial<
        Record<
          | "code"
          | "title"
          | "description"
          | "discountType"
          | "discountValue"
          | "minSpend"
          | "validFrom"
          | "validTo"
          | "usageLimit",
          string[]
        >
      >;
      message?: string;
    }
  | undefined;

/** "" -> undefined so an optional numeric field left blank doesn't get coerced to 0 by z.coerce.number(). */
const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const PromotionFormSchema = z.object({
  code: z.string().min(1, { error: "Code is required." }).trim(),
  title: z.string().min(1, { error: "Title is required." }).trim(),
  description: z.string().min(1, { error: "Description is required." }).trim(),
  discountType: z.enum(DiscountType, { error: "Choose a discount type." }),
  discountValue: z.coerce
    .number({ error: "Enter a discount value." })
    .positive({ error: "Discount value must be greater than 0." }),
  minSpend: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Enter a valid minimum spend." })
      .nonnegative({ error: "Minimum spend can't be negative." })
      .optional()
  ),
  validFrom: z.string().min(1, { error: "Pick a start date." }),
  validTo: z.string().min(1, { error: "Pick an end date." }),
  active: z.boolean(),
  usageLimit: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Enter a whole number." })
      .int({ error: "Usage limit must be a whole number." })
      .positive({ error: "Usage limit must be greater than 0." })
      .optional()
  ),
});

function parsePromotionForm(formData: FormData) {
  return PromotionFormSchema.safeParse({
    code: formData.get("code"),
    title: formData.get("title"),
    description: formData.get("description"),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    minSpend: formData.get("minSpend"),
    validFrom: formData.get("validFrom"),
    validTo: formData.get("validTo"),
    // Unchecked checkboxes aren't submitted at all — absence means false.
    active: formData.get("active") === "on",
    usageLimit: formData.get("usageLimit"),
  });
}

/**
 * Cross-field checks zod's object schema can't express on its own: the date
 * strings have to actually parse and be ordered, and a percentage discount
 * has to stay a percentage. Returns field errors in the same shape as a
 * failed safeParse, or null when everything checks out.
 */
function validateBusinessRules(data: z.infer<typeof PromotionFormSchema>): PromotionFormState {
  const validFrom = new Date(data.validFrom);
  const validTo = new Date(data.validTo);

  if (Number.isNaN(validFrom.getTime())) {
    return { errors: { validFrom: ["Enter a valid date and time."] } };
  }
  if (Number.isNaN(validTo.getTime())) {
    return { errors: { validTo: ["Enter a valid date and time."] } };
  }
  if (validTo <= validFrom) {
    return { errors: { validTo: ["End date must be after the start date."] } };
  }
  if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
    return { errors: { discountValue: ["A percentage discount can't exceed 100."] } };
  }

  return undefined;
}

/** ADMIN check — independent of any page-level gate, same pattern as updateUserRoleAction in actions/users.ts. */
async function requireAdmin(): Promise<{ ok: true } | { ok: false; state: PromotionFormState }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, state: { message: "You don't have permission to manage promotions." } };
  }
  return { ok: true };
}

/** True when a P2002 unique-constraint error is Promotion.code specifically, vs. some other unique field. */
function isCodeCollision(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (error.meta?.target as string[] | undefined)?.includes("code") === true
  );
}

export async function createPromotionAction(
  _prevState: PromotionFormState,
  formData: FormData
): Promise<PromotionFormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const validated = parsePromotionForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;

  const businessError = validateBusinessRules(data);
  if (businessError) return businessError;

  try {
    await prisma.promotion.create({
      data: {
        code: data.code,
        title: data.title,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minSpend: data.minSpend ?? null,
        validFrom: new Date(data.validFrom),
        validTo: new Date(data.validTo),
        active: data.active,
        usageLimit: data.usageLimit ?? null,
      },
    });
  } catch (error) {
    if (isCodeCollision(error)) {
      return { errors: { code: ["This code is already in use."] } };
    }
    throw error;
  }

  redirect("/admin/promotions");
}

export async function updatePromotionAction(
  _prevState: PromotionFormState,
  formData: FormData
): Promise<PromotionFormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const promotionId = formData.get("promotionId");
  if (typeof promotionId !== "string" || !promotionId) {
    return { message: "Missing promotion id." };
  }

  const validated = parsePromotionForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;

  const businessError = validateBusinessRules(data);
  if (businessError) return businessError;

  const existing = await prisma.promotion.findUnique({ where: { id: promotionId }, select: { id: true } });
  if (!existing) {
    return { message: "Promotion not found." };
  }

  try {
    await prisma.promotion.update({
      where: { id: promotionId },
      data: {
        code: data.code,
        title: data.title,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minSpend: data.minSpend ?? null,
        validFrom: new Date(data.validFrom),
        validTo: new Date(data.validTo),
        active: data.active,
        usageLimit: data.usageLimit ?? null,
      },
    });
  } catch (error) {
    if (isCodeCollision(error)) {
      return { errors: { code: ["This code is already in use."] } };
    }
    throw error;
  }

  redirect("/admin/promotions");
}

export type DeletePromotionResult = { ok: true } | { ok: false; error: string };

export async function deletePromotionAction(promotionId: string): Promise<DeletePromotionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in." };
  }
  if (user.role !== "ADMIN") {
    return { ok: false, error: "You don't have permission to delete promotions." };
  }

  const existing = await prisma.promotion.findUnique({ where: { id: promotionId }, select: { id: true } });
  if (!existing) {
    return { ok: false, error: "Promotion not found." };
  }

  // Proactive guard: Booking -> Promotion has no cascade in the schema
  // (promotionId is a plain nullable FK, ON DELETE RESTRICT by default), so
  // a code that's actually been redeemed would block the delete at the DB
  // level — check up front instead of surfacing a raw constraint failure.
  const bookingCount = await prisma.booking.count({ where: { promotionId } });
  if (bookingCount > 0) {
    return {
      ok: false,
      error: `Can't delete — this promo has been used in ${bookingCount} booking${bookingCount === 1 ? "" : "s"}. Mark it inactive instead.`,
    };
  }

  try {
    // Defense-in-depth against the count-check above being stale by the
    // time this runs (e.g. a booking redeeming this code placed
    // concurrently) — same isForeignKeyRestrictionError fallback as
    // deleteMovieAction.
    await prisma.promotion.delete({ where: { id: promotionId } });
  } catch (error) {
    if (isForeignKeyRestrictionError(error)) {
      return { ok: false, error: "Can't delete — this promo has bookings on file." };
    }
    throw error;
  }

  return { ok: true };
}

export type ApplyPromoCodeResult = { ok: true; discount: number } | { ok: false; error: string };

/**
 * Checkout-time preview: validates a promo code against the cart subtotal
 * (tickets + food, before the booking fee) and returns the discount
 * applyDiscount() computes for it. This is a preview only — the discount it
 * returns is never trusted as-is downstream. confirmBookingAction
 * re-validates the code from scratch against the server's own totals at
 * booking time, since the code can expire or hit its usage limit in the gap
 * between checkout and payment.
 */
export async function applyPromoCodeAction(code: string, subtotal: number): Promise<ApplyPromoCodeResult> {
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return { ok: false, error: "Invalid order total." };
  }

  const result = await validatePromoCode(prisma, code, new Prisma.Decimal(subtotal));
  if (!result.ok) return result;

  const discount = applyDiscount(new Prisma.Decimal(subtotal), result.promotion);
  return { ok: true, discount: discount.toNumber() };
}
