"use server";

import { Prisma, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { confirmSeats, releaseBookedSeats, SeatConflictError } from "@/lib/seat-locking";
import { BOOKING_FEE, foodTotal as sumFoodTotal, bookingTotal, generateBookingRef } from "@/lib/pricing";

const Decimal = Prisma.Decimal;

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
 */
export async function confirmBookingAction(input: {
  showtimeId: string;
  showtimeSeatIds: string[];
  foodItems: { id: string; quantity: number }[];
  paymentMethod: PaymentMethod;
}): Promise<ConfirmBookingResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in to complete your booking." };
  }

  const { showtimeId, showtimeSeatIds, foodItems, paymentMethod } = input;

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
  const discount = new Decimal(0);
  const total = bookingTotal({ ticketsTotal, foodTotal, discount });

  const expiresAt =
    heldSeats
      .map((s) => s.holdExpiresAt)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? new Date();

  try {
    const booking = await createBookingWithRef({
      user: { connect: { id: user.id } },
      showtime: { connect: { id: showtimeId } },
      status: "CONFIRMED",
      ticketsTotal,
      foodTotal,
      bookingFee: BOOKING_FEE,
      discount,
      total,
      expiresAt,
      seats: {
        create: heldSeats.map((s) => ({
          price: s.price,
          showtimeSeat: { connect: { id: s.id } },
        })),
      },
      foodOrder:
        foodOrderItems.length > 0
          ? {
              create: {
                items: {
                  create: foodOrderItems.map((item) => ({
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
          method: paymentMethod,
          status: "SUCCESS",
          amount: total,
          paidAt: new Date(),
        },
      },
      ticket: {
        create: { status: "ACTIVE" },
      },
    });

    return { ok: true, bookingId: booking.id };
  } catch (error) {
    // Seats are already BOOKED at this point — if writing the rest of the
    // booking failed, release them rather than leaving inventory stuck on
    // a booking that doesn't exist.
    await releaseBookedSeats(showtimeSeatIds);
    throw error;
  }
}

export type CancelBookingResult = { ok: true } | { ok: false; error: string };

/**
 * Cancels a booking: flips it to CANCELLED and releases its seats back into
 * inventory via releaseBookedSeats(). Only the booking's own user may
 * cancel it. Cancelling an already-cancelled booking is a no-op success —
 * the button that triggers this only shows for the user's own upcoming
 * bookings, but a second click (e.g. a double-submit) shouldn't error.
 */
export async function cancelBookingAction(bookingId: string): Promise<CancelBookingResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in to manage your bookings." };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { seats: true },
  });
  if (!booking || booking.userId !== user.id) {
    return { ok: false, error: "Booking not found." };
  }
  if (booking.status === "CANCELLED") {
    return { ok: true };
  }

  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
  await releaseBookedSeats(booking.seats.map((s) => s.showtimeSeatId));

  return { ok: true };
}

/** Retries booking creation on a bookingRef collision (P2002) — the ref space is large, so this is a rare-case safety net, not the common path. */
async function createBookingWithRef(data: Omit<Prisma.BookingCreateInput, "bookingRef">) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.booking.create({ data: { ...data, bookingRef: generateBookingRef() } });
    } catch (error) {
      const isRefCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        (error.meta?.target as string[] | undefined)?.includes("bookingRef");
      if (!isRefCollision || attempt === 4) throw error;
    }
  }
  throw new Error("unreachable");
}
