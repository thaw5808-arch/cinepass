"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type ValidateTicketResult =
  | { ok: true; state: "VALID"; ref: string }
  | { ok: true; state: "ALREADY_USED"; ref: string }
  | { ok: true; state: "INVALID" }
  | { ok: false; error: string };

/**
 * Looks up a scanned/typed code against the real Ticket table and, if it's
 * a still-active ticket, admits it — flipping ACTIVE -> USED in the same
 * request. Accepts either Ticket.qrToken (what the QR actually encodes,
 * see qr-code-image usage on the ticket page) or Booking.bookingRef (the
 * short human-facing code, easier to type by hand at a desk).
 */
export async function validateTicketAction(rawInput: string): Promise<ValidateTicketResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in to validate tickets." };
  }
  // Restricted to staff — see StaffValidatePage for the page-level gate;
  // this check is the one that actually matters since it's what stops a
  // logged-in customer from calling the action directly.
  if (user.role !== "STAFF" && user.role !== "ADMIN") {
    return { ok: false, error: "You don't have permission to validate tickets." };
  }

  const code = rawInput.trim().replace(/^cinepass:ticket:/i, "");
  if (!code) {
    return { ok: false, error: "Enter a ticket code." };
  }

  const ticket = await prisma.ticket.findFirst({
    where: { OR: [{ qrToken: code }, { booking: { bookingRef: code.toUpperCase() } }] },
    include: { booking: true },
  });

  if (!ticket || ticket.status === "CANCELLED" || ticket.status === "EXPIRED") {
    return { ok: true, state: "INVALID" };
  }

  if (ticket.status === "USED") {
    return { ok: true, state: "ALREADY_USED", ref: ticket.booking.bookingRef };
  }

  // Conditional update — mirrors confirmSeats() in seat-locking.ts: only
  // flips ACTIVE -> USED, so a double-scan race admits exactly once.
  const { count } = await prisma.ticket.updateMany({
    where: { id: ticket.id, status: "ACTIVE" },
    data: { status: "USED", usedAt: new Date(), validatedById: user.id },
  });

  if (count === 0) {
    // Another scan won the race between our read and this write.
    return { ok: true, state: "ALREADY_USED", ref: ticket.booking.bookingRef };
  }

  return { ok: true, state: "VALID", ref: ticket.booking.bookingRef };
}
