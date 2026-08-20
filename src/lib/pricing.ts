import { Prisma, DiscountType } from "@prisma/client";

const Decimal = Prisma.Decimal;
type Decimal = Prisma.Decimal;
export { generateBookingRef } from "@/lib/booking-ref";

export const BOOKING_FEE = new Decimal(20);

export function foodTotal(items: { price: Decimal; quantity: number }[]) {
  return items.reduce((sum, i) => sum.add(i.price.mul(i.quantity)), new Decimal(0));
}

export function applyDiscount(
  subtotal: Decimal,
  promo: { discountType: DiscountType; discountValue: Decimal; minSpend: Decimal | null } | null
) {
  if (!promo) return new Decimal(0);
  if (promo.minSpend && subtotal.lt(promo.minSpend)) return new Decimal(0);

  if (promo.discountType === "PERCENTAGE") {
    return subtotal.mul(promo.discountValue).div(100);
  }
  // FIXED_AMOUNT and COMBO both resolve to a flat amount off, never
  // exceeding the subtotal itself.
  return Decimal.min(promo.discountValue, subtotal);
}

export function bookingTotal({
  ticketsTotal,
  foodTotal,
  discount,
}: {
  ticketsTotal: Decimal;
  foodTotal: Decimal;
  discount: Decimal;
}) {
  return ticketsTotal.add(foodTotal).add(BOOKING_FEE).sub(discount);
}

