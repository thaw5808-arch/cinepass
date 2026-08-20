"use server";

import { getCurrentUser } from "@/lib/session";
import { holdSeats, releaseSeats, SeatConflictError } from "@/lib/seat-locking";

export type HoldSeatsResult =
  | { ok: true; holdExpiresAt: string }
  | { ok: false; error: string; conflictIds?: string[] };

/**
 * Server-side confirmation for a seat hold — the seat map must not mark a
 * seat SELECTED until this resolves `ok: true`. Wraps seat-locking's
 * holdSeats(), which atomically holds every id or none of them, so on
 * conflict the caller's whole batch stays AVAILABLE except the ids in
 * conflictIds, which really are taken by someone else.
 */
export async function holdSeatsAction(
  showtimeId: string,
  showtimeSeatIds: string[]
): Promise<HoldSeatsResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in to select seats." };
  }
  if (showtimeSeatIds.length === 0) {
    return { ok: true, holdExpiresAt: new Date().toISOString() };
  }

  try {
    const holdExpiresAt = await holdSeats(showtimeId, showtimeSeatIds, user.id);
    return { ok: true, holdExpiresAt: holdExpiresAt.toISOString() };
  } catch (error) {
    if (error instanceof SeatConflictError) {
      return {
        ok: false,
        error:
          showtimeSeatIds.length === 1
            ? "That seat was just taken by another customer."
            : "Some of those seats were just taken by another customer.",
        conflictIds: error.seatIds,
      };
    }
    throw error;
  }
}

/** Releases seats immediately on deselect, rather than leaving them held until the timer lapses. */
export async function releaseSeatsAction(showtimeSeatIds: string[]) {
  const user = await getCurrentUser();
  if (!user || showtimeSeatIds.length === 0) return { ok: false as const };

  await releaseSeats(showtimeSeatIds, user.id);
  return { ok: true as const };
}
