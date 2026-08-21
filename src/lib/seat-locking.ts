import { prisma } from "@/lib/prisma";
import { Prisma, SeatStatus } from "@prisma/client";

const HOLD_MINUTES = Number(process.env.SEAT_HOLD_MINUTES ?? 10);

export class SeatConflictError extends Error {
  constructor(public seatIds: string[]) {
    super("One or more seats are no longer available");
    this.name = "SeatConflictError";
  }
}

/**
 * Treats any HELD seat whose hold has expired as AVAILABLE again.
 * Call this before reading seat state so the seat map never shows a
 * stale hold, and before attempting to place a new hold.
 */
export async function releaseExpiredHolds(showtimeId: string) {
  await prisma.showtimeSeat.updateMany({
    where: {
      showtimeId,
      status: SeatStatus.HELD,
      holdExpiresAt: { lt: new Date() },
    },
    data: { status: SeatStatus.AVAILABLE, heldByUserId: null, holdExpiresAt: null },
  });
}

/**
 * Attempts to move the given seats from AVAILABLE -> HELD for this user.
 * Uses a conditional updateMany (status: AVAILABLE in the where clause)
 * inside a transaction so a race between two users resolves atomically —
 * whoever's update actually matches rows wins; the loser gets a
 * SeatConflictError instead of a false "success".
 */
export async function holdSeats(showtimeId: string, showtimeSeatIds: string[], userId: string) {
  await releaseExpiredHolds(showtimeId);

  const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const result = await tx.showtimeSeat.updateMany({
      where: {
        id: { in: showtimeSeatIds },
        showtimeId,
        status: SeatStatus.AVAILABLE,
      },
      data: {
        status: SeatStatus.HELD,
        heldByUserId: userId,
        holdExpiresAt,
      },
    });

    if (result.count !== showtimeSeatIds.length) {
      // Some seats were already taken — roll back and report which ones.
      const stillMine = await tx.showtimeSeat.findMany({
        where: { id: { in: showtimeSeatIds }, heldByUserId: userId },
        select: { id: true },
      });
      await tx.showtimeSeat.updateMany({
        where: { id: { in: stillMine.map((s) => s.id) } },
        data: { status: SeatStatus.AVAILABLE, heldByUserId: null, holdExpiresAt: null },
      });
      const unavailable = showtimeSeatIds.filter((id) => !stillMine.some((s) => s.id === id));
      throw new SeatConflictError(unavailable);
    }

    return holdExpiresAt;
  });
}

/** Releases seats this user is currently holding (checkout abandoned / seat deselected). */
export async function releaseSeats(showtimeSeatIds: string[], userId: string) {
  await prisma.showtimeSeat.updateMany({
    where: { id: { in: showtimeSeatIds }, heldByUserId: userId, status: SeatStatus.HELD },
    data: { status: SeatStatus.AVAILABLE, heldByUserId: null, holdExpiresAt: null },
  });
}

/**
 * Confirms a booking: re-verifies every seat is still HELD by this user
 * and not expired, then flips them to BOOKED. Called only after payment
 * succeeds. Throws SeatConflictError if the hold lapsed mid-checkout.
 */
export async function confirmSeats(showtimeSeatIds: string[], userId: string) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.showtimeSeat.updateMany({
      where: {
        id: { in: showtimeSeatIds },
        heldByUserId: userId,
        status: SeatStatus.HELD,
        holdExpiresAt: { gt: new Date() },
      },
      data: { status: SeatStatus.BOOKED, holdExpiresAt: null },
    });

    if (result.count !== showtimeSeatIds.length) {
      throw new SeatConflictError(showtimeSeatIds);
    }
  });
}

/**
 * Cancellation: BOOKED -> AVAILABLE, releasing the seats back into
 * inventory. Takes an optional transaction client (defaulting to the plain
 * `prisma` singleton) so callers that need this atomic with other writes —
 * cancelBookingAction's refund update, confirmBookingAction's rollback on a
 * failed write — can pass their own `tx` and have it run inside the same
 * transaction rather than as a separate commit.
 */
export async function releaseBookedSeats(
  showtimeSeatIds: string[],
  client: Prisma.TransactionClient = prisma
) {
  await client.showtimeSeat.updateMany({
    where: { id: { in: showtimeSeatIds }, status: SeatStatus.BOOKED },
    data: { status: SeatStatus.AVAILABLE, heldByUserId: null, holdExpiresAt: null },
  });
}
