import { prisma } from "@/lib/prisma";

/**
 * True if [startTime, endTime) overlaps any existing showtime on the same
 * screen. Two half-open intervals overlap when one starts before the other
 * ends on both sides: existing.startTime < newEndTime && existing.endTime
 * > newStartTime. This is the application-level enforcement the schema
 * comment on Showtime (prisma/schema.prisma) points to — Postgres can't
 * express an overlap constraint directly, so it's checked here before
 * every create.
 */
export async function hasOverlappingShowtime(
  screenId: string,
  startTime: Date,
  endTime: Date,
  excludeShowtimeId?: string
): Promise<boolean> {
  const conflict = await prisma.showtime.findFirst({
    where: {
      screenId,
      id: excludeShowtimeId ? { not: excludeShowtimeId } : undefined,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });
  return conflict !== null;
}
