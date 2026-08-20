import { Prisma, DiscountType, SeatCategory } from "@prisma/client";

const Decimal = Prisma.Decimal;
type Decimal = Prisma.Decimal;
export { generateBookingRef } from "@/lib/booking-ref";

export const BOOKING_FEE = new Decimal(20);

/**
 * Per-category seat price markup over a showtime's base price. Mirrors
 * priceFor() in prisma/seed.ts exactly — that script deliberately stays
 * import-free of src/lib (see its own header comment), so this is kept in
 * sync by hand rather than shared; admin-created showtimes (see
 * actions/showtimes.ts) use this so their ShowtimeSeat prices come out
 * consistent with seeded ones.
 */
export function seatPriceFor(category: SeatCategory, basePrice: number): number {
  switch (category) {
    case "VIP":
      return basePrice + 120;
    case "PREMIUM":
      return basePrice + 60;
    case "COUPLE":
      return basePrice * 2 + 80;
    default:
      return basePrice;
  }
}

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

