import { Prisma } from "@prisma/client";
import type { Promotion } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Server-only — see the header comment on lib/food.ts for why this module
// stays prisma-only rather than also exporting client-safe constants.

/** Customer-facing catalog — only offers that are active and currently within their date window, for /offers. */
export function getActivePromotions() {
  const now = new Date();
  return prisma.promotion.findMany({
    where: { active: true, validFrom: { lte: now }, validTo: { gte: now } },
    orderBy: { validTo: "asc" },
  });
}

export type PromoValidationResult =
  | { ok: true; promotion: Promotion }
  | { ok: false; error: string };

/**
 * Server-side promo code validation — checks the code exists, is active,
 * falls within its valid date window, meets the given subtotal's minimum
 * spend, and hasn't hit its usage limit. Shared by the checkout preview
 * (applyPromoCodeAction in actions/promotions.ts) and the final re-check at
 * booking time (confirmBookingAction in actions/booking.ts): a code can
 * legitimately expire or hit its limit in the gap between the two, so both
 * call sites run this exact same check rather than the later one trusting
 * the earlier one. Takes a plain Prisma client or a `$transaction` callback
 * client so the booking-time caller can run it inside the same transaction
 * as the usedCount increment.
 */
export async function validatePromoCode(
  client: Prisma.TransactionClient,
  code: string,
  subtotal: Prisma.Decimal
): Promise<PromoValidationResult> {
  const trimmed = code.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a promo code." };
  }

  const promotion = await client.promotion.findUnique({ where: { code: trimmed } });
  if (!promotion) {
    return { ok: false, error: "This promo code doesn't exist." };
  }
  if (!promotion.active) {
    return { ok: false, error: "This promo code is no longer active." };
  }

  const now = new Date();
  if (now < promotion.validFrom || now > promotion.validTo) {
    return { ok: false, error: "This promo code isn't valid right now." };
  }
  if (promotion.minSpend && subtotal.lt(promotion.minSpend)) {
    return {
      ok: false,
      error: `This code needs a minimum spend of ฿${promotion.minSpend.toNumber().toFixed(0)}.`,
    };
  }
  if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) {
    return { ok: false, error: "This promo code has reached its usage limit." };
  }

  return { ok: true, promotion };
}
