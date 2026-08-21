import { redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { MyTicketsList, type TicketSummary } from "./my-tickets-list";

export default async function MyTicketsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnTo=%2Fmy-tickets");
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id, status: { in: ["CONFIRMED", "CANCELLED"] } },
    include: {
      showtime: { include: { movie: true, cinema: true, screen: true } },
      seats: { include: { showtimeSeat: { include: { seat: true } } } },
      payment: true,
    },
    orderBy: { showtime: { startTime: "desc" } },
  });

  const now = new Date();
  const upcoming: TicketSummary[] = [];
  const completed: TicketSummary[] = [];
  const cancelled: TicketSummary[] = [];

  for (const b of bookings) {
    const seatLabels = b.seats
      .map((bs) => bs.showtimeSeat.seat)
      .slice()
      .sort((a, c) => (a.row + String(a.number)).localeCompare(c.row + String(c.number)))
      .map((s) => `${s.row}${s.number}`)
      .join(", ");

    const summary: TicketSummary = {
      bookingId: b.id,
      showtimeId: b.showtimeId,
      ref: b.bookingRef,
      movie: b.showtime.movie.title,
      cinema: b.showtime.cinema.name,
      date: format(b.showtime.startTime, "MMMM d, yyyy"),
      time: format(b.showtime.startTime, "h:mm a"),
      seats: seatLabels || "—",
      refundedAt: b.payment?.refundedAt ? format(b.payment.refundedAt, "MMM d, yyyy") : null,
    };

    if (b.status === "CANCELLED") cancelled.push(summary);
    else if (b.showtime.startTime > now) upcoming.push(summary);
    else completed.push(summary);
  }

  // Fetched desc by showtime — upcoming reads better soonest-first.
  upcoming.reverse();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl tracking-wide mb-6">My Tickets</h1>
      <MyTicketsList upcoming={upcoming} completed={completed} cancelled={cancelled} />
    </div>
  );
}
