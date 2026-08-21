"use server";

import { format } from "date-fns";
import { Prisma, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { confirmSeats, releaseBookedSeats, SeatConflictError } from "@/lib/seat-locking";
import { BOOKING_FEE, foodTotal as sumFoodTotal, bookingTotal, applyDiscount, generateBookingRef } from "@/lib/pricing";
import { validatePromoCode } from "@/lib/promotions";

const Decimal = Prisma.Decimal;

/** Thrown inside createBookingAtomic's transaction when a promo code fails re-validation at booking time — caught outside to turn into a normal {ok:false} result instead of a 500. */
class PromoRejectedError extends Error {}

export type ConfirmBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string };

/**
 * Finalizes a booking after the (simulated) payment gateway reports
 * success. Re-verifies the seat holds server-side — never trusts the
 * client's totals or a client-reported "success" — then atomically writes
 * the Booking, its seats, an optional food order, the Payment, and the
 * Ticket. Called only after the client's simulated charge succeeds; on
 * decline the caller never reaches this action and the seats stay held.
 *
 * If a promo code is supplied, it's re-validated from scratch here (never
 * trusting the checkout-time preview from applyPromoCodeAction) — it can
 * legitimately have expired or hit its usage limit in the gap between
 * checkout and payment — and Promotion.usedCount is incremented atomically
 * in the same transaction as the Booking write.
 */
export async function confirmBookingAction(input: {
  showtimeId: string;
  showtimeSeatIds: string[];
  foodItems: { id: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  promoCode?: string;
}): Promise<ConfirmBookingResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in to complete your booking." };
  }

  const { showtimeId, showtimeSeatIds, foodItems, paymentMethod, promoCode } = input;

  if (showtimeSeatIds.length === 0) {
    return { ok: false, error: "No seats selected." };
  }
  if (!Object.values(PaymentMethod).includes(paymentMethod)) {
    return { ok: false, error: "Invalid payment method." };
  }

  // Read seat price + hold expiry *before* confirmSeats() clears them, so
  // the booking's price snapshot reflects what the customer actually held.
  // Prices come from the server, never the client.
  const heldSeats = await prisma.showtimeSeat.findMany({
    where: { id: { in: showtimeSeatIds }, showtimeId },
  });
  if (heldSeats.length !== showtimeSeatIds.length) {
    return { ok: false, error: "One or more selected seats are invalid for this showtime." };
  }

  const cartQuantities = new Map(
    foodItems.filter((f) => Number.isInteger(f.quantity) && f.quantity > 0).map((f) => [f.id, f.quantity])
  );
  const foodCatalogItems =
    cartQuantities.size > 0
      ? await prisma.foodItem.findMany({ where: { id: { in: Array.from(cartQuantities.keys()) } } })
      : [];

  try {
    // Re-verifies every seat is still held by this user and not expired,
    // then flips them to BOOKED. Throws SeatConflictError if the hold
    // lapsed mid-payment.
    await confirmSeats(showtimeSeatIds, user.id);
  } catch (error) {
    if (error instanceof SeatConflictError) {
      return {
        ok: false,
        error: "Your seat hold expired while payment was processing. Please select your seats again.",
      };
    }
    throw error;
  }

  const ticketsTotal = heldSeats.reduce((sum, s) => sum.add(s.price), new Decimal(0));
  const foodOrderItems = foodCatalogItems.map((item) => ({
    foodItemId: item.id,
    price: item.price,
    quantity: cartQuantities.get(item.id)!,
  }));
  const foodTotal = sumFoodTotal(foodOrderItems);

  const expiresAt =
    heldSeats
      .map((s) => s.holdExpiresAt)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? new Date();

  try {
    const booking = await createBookingAtomic({
      userId: user.id,
      showtimeId,
      ticketsTotal,
      foodTotal,
      heldSeats,
      foodOrderItems,
      paymentMethod,
      expiresAt,
      promoCode,
    });

    return { ok: true, bookingId: booking.id };
  } catch (error) {
    // Seats are already BOOKED at this point — if writing the rest of the
    // booking failed (including a promo code rejected at the last second),
    // release them rather than leaving inventory stuck on a booking that
    // doesn't exist.
    await releaseBookedSeats(showtimeSeatIds);
    if (error instanceof PromoRejectedError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

export type CancelBookingResult =
  | { ok: true; refundedAt: string | null }
  | { ok: false; error: string };

/**
 * Cancels a booking: flips it to CANCELLED, releases its seats back into
 * inventory, and — if the booking has a successfully-paid Payment on file —
 * refunds it (status -> REFUNDED, refundedAt stamped). All three writes run
 * inside one transaction, same pattern as createBookingAtomic's atomic
 * promo-increment-plus-booking-write: a cancellation should never leave the
 * booking CANCELLED with seats still marked BOOKED, or seats released with
 * the payment still showing as taken.
 *
 * Only the booking's own user may cancel it. Cancelling an already-cancelled
 * booking is a no-op success — the button that triggers this only shows for
 * the user's own upcoming bookings, but a second click (e.g. a
 * double-submit) shouldn't error.
 */
export async function cancelBookingAction(bookingId: string): Promise<CancelBookingResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in to manage your bookings." };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { seats: true, payment: true },
  });
  if (!booking || booking.userId !== user.id) {
    return { ok: false, error: "Booking not found." };
  }
  if (booking.status === "CANCELLED") {
    return {
      ok: true,
      refundedAt: booking.payment?.refundedAt ? format(booking.payment.refundedAt, "MMM d, yyyy") : null,
    };
  }

  let refundedAt: Date | null = null;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
    await releaseBookedSeats(
      booking.seats.map((s) => s.showtimeSeatId),
      tx
    );

    // A booking's Payment is optional in the schema, and only a SUCCESS
    // payment represents money actually taken — a PENDING/FAILED payment
    // (or none at all) has nothing to refund.
    if (booking.payment && booking.payment.status === "SUCCESS") {
      const refunded = await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: "REFUNDED", refundedAt: new Date() },
      });
      refundedAt = refunded.refundedAt;
    }
  });

  return { ok: true, refundedAt: refundedAt ? format(refundedAt, "MMM d, yyyy") : null };
}

/**
 * Writes the Booking (plus seats/food order/payment/ticket) inside one
 * transaction, retrying on a bookingRef collision (P2002) — the ref space
 * is large, so this is a rare-case safety net, not the common path.
 *
 * When a promo code is supplied, its final re-validation and the
 * Promotion.usedCount increment happen *inside the same transaction* as the
 * Booking write: either both land or neither does. The increment itself
 * uses a conditional updateMany (usedCount < usageLimit in the WHERE
 * clause, mirroring the AVAILABLE-status guard in seat-locking.ts's
 * holdSeats) so two bookings racing the last redemption of a limited code
 * can't both succeed — whichever updateMany actually matches the row wins,
 * the loser gets rejected instead of silently over-redeeming the code. On a
 * bookingRef collision the whole transaction (promo re-check included)
 * retries fresh, since the rollback already undid the increment.
 */
async function createBookingAtomic(params: {
  userId: string;
  showtimeId: string;
  ticketsTotal: Prisma.Decimal;
  foodTotal: Prisma.Decimal;
  heldSeats: { id: string; price: Prisma.Decimal }[];
  foodOrderItems: { foodItemId: string; price: Prisma.Decimal; quantity: number }[];
  paymentMethod: PaymentMethod;
  expiresAt: Date;
  promoCode?: string;
}) {
  const subtotal = params.ticketsTotal.add(params.foodTotal);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        let discount = new Decimal(0);
        let promotionId: string | undefined;

        if (params.promoCode) {
          const result = await validatePromoCode(tx, params.promoCode, subtotal);
          if (!result.ok) throw new PromoRejectedError(result.error);

          const promo = result.promotion;
          discount = applyDiscount(subtotal, promo);

          const guardWhere: Prisma.PromotionWhereInput = { id: promo.id };
          if (promo.usageLimit !== null) {
            guardWhere.usedCount = { lt: promo.usageLimit };
          }
          const incremented = await tx.promotion.updateMany({
            where: guardWhere,
            data: { usedCount: { increment: 1 } },
          });
          if (incremented.count !== 1) {
            throw new PromoRejectedError(
              "This promo code just hit its usage limit — remove it and try again."
            );
          }
          promotionId = promo.id;
        }

        const total = bookingTotal({ ticketsTotal: params.ticketsTotal, foodTotal: params.foodTotal, discount });

        return tx.booking.create({
          data: {
            user: { connect: { id: params.userId } },
            showtime: { connect: { id: params.showtimeId } },
            status: "CONFIRMED",
            bookingRef: generateBookingRef(),
            ticketsTotal: params.ticketsTotal,
            foodTotal: params.foodTotal,
            bookingFee: BOOKING_FEE,
            discount,
            total,
            expiresAt: params.expiresAt,
            ...(promotionId ? { promotion: { connect: { id: promotionId } } } : {}),
            seats: {
              create: params.heldSeats.map((s) => ({
                price: s.price,
                showtimeSeat: { connect: { id: s.id } },
              })),
            },
            foodOrder:
              params.foodOrderItems.length > 0
                ? {
                    create: {
                      items: {
                        create: params.foodOrderItems.map((item) => ({
                          quantity: item.quantity,
                          price: item.price,
                          foodItem: { connect: { id: item.foodItemId } },
                        })),
                      },
                    },
                  }
                : undefined,
            payment: {
              create: {
                method: params.paymentMethod,
                status: "SUCCESS",
                amount: total,
                paidAt: new Date(),
              },
            },
            ticket: {
              create: { status: "ACTIVE" },
            },
          },
        });
      });
    } catch (error) {
      if (error instanceof PromoRejectedError) throw error;
      const isRefCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        (error.meta?.target as string[] | undefined)?.includes("bookingRef");
      if (!isRefCollision || attempt === 4) throw error;
    }
  }
  throw new Error("unreachable");
}
