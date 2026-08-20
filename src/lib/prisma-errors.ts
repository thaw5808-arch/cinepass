import { Prisma } from "@prisma/client";

/**
 * True when a Prisma error means "this delete was blocked by a foreign key
 * pointing at the row" — covers both:
 *  - P2003, Prisma's own code for a plain foreign_key_violation (SQLSTATE
 *    23503), which @prisma/adapter-pg classifies directly.
 *  - P2039, Prisma's generic "Database error" wrapper for driver-adapter
 *    errors it *can't* classify — which is what a RESTRICT violation
 *    (SQLSTATE 23001, e.g. what Booking -> Showtime's ON DELETE RESTRICT
 *    raises) falls into, since adapter-pg only maps 23503 to a known kind.
 *    The original Postgres SQLSTATE survives underneath at
 *    error.meta.driverAdapterError.cause.originalCode, so P2039 alone
 *    isn't enough to conclude "foreign key" — it's confirmed by checking
 *    that nested code against the same SQLSTATEs. Verified against the
 *    real error shape by reproducing a blocked delete against dev data.
 *
 * Shared by every admin delete action that can hit a RESTRICT'd relation
 * (movies, cinemas, screens, ...) rather than re-deriving this per file.
 */
export function isForeignKeyRestrictionError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === "P2003") return true;
  if (error.code !== "P2039") return false;

  const driverAdapterError = error.meta?.driverAdapterError;
  const originalCode =
    driverAdapterError && typeof driverAdapterError === "object" && "cause" in driverAdapterError
      ? (driverAdapterError as { cause?: { originalCode?: unknown } }).cause?.originalCode
      : undefined;

  return originalCode === "23001" || originalCode === "23503";
}
