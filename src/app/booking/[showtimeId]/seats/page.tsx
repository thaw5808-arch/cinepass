import { redirect } from "next/navigation";
import type { SeatMapSeat } from "@/components/seating/seat-map";
import { prisma } from "@/lib/prisma";
import { releaseExpiredHolds } from "@/lib/seat-locking";
import { getCurrentUser } from "@/lib/session";
import { SeatSelection } from "./seat-selection";

export default async function SeatSelectionPage({
  params,
}: {
  params: Promise<{ showtimeId: string }>;
}) {
  const { showtimeId } = await params;

  // Seat holds are tied to a user — bounce to login before showing the map.
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(`/booking/${showtimeId}/seats`)}`);
  }

  // Expired holds read back as AVAILABLE, never as a stale HELD.
  await releaseExpiredHolds(showtimeId);

  const showtimeSeats = await prisma.showtimeSeat.findMany({
    where: { showtimeId },
    include: { seat: true },
  });

  const seats: SeatMapSeat[] = showtimeSeats.map((ss) => ({
    id: ss.id,
    row: ss.seat.row,
    number: ss.seat.number,
    posX: ss.seat.posX,
    posY: ss.seat.posY,
    category: ss.seat.category,
    status: ss.status,
    price: ss.price.toNumber(),
  }));

  return <SeatSelection seats={seats} />;
}
