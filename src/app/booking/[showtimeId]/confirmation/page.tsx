import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Wallet, Navigation, Home } from "lucide-react";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ showtimeId: string }>;
  searchParams: Promise<{ booking?: string }>;
}) {
  const { showtimeId } = await params;
  const { booking: bookingId } = await searchParams;

  const user = await getCurrentUser();
  if (!user || !bookingId) notFound();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      showtime: { include: { movie: true, cinema: true, screen: true } },
      seats: { include: { showtimeSeat: { include: { seat: true } } } },
    },
  });

  // Only the owning user may view their own booking, and only under the
  // showtime it was actually made for.
  if (!booking || booking.userId !== user.id || booking.showtimeId !== showtimeId) notFound();

  const seatLabels = booking.seats
    .map((bs) => bs.showtimeSeat.seat)
    .slice()
    .sort((a, b) => (a.row + String(a.number)).localeCompare(b.row + String(b.number)))
    .map((s) => `${s.row}${s.number}`)
    .join(", ");

  return (
    <div className="mx-auto max-w-md text-center py-8">
      <CheckCircle2 className="mx-auto h-14 w-14 text-marquee-gold mb-4" />
      <h1 className="font-display text-3xl tracking-wide mb-1">Booking Confirmed</h1>
      <p className="text-text-muted text-sm mb-8">
        Payment successful — your seats are confirmed.
      </p>

      <div className="rounded-lg border border-border bg-bg-elevated p-6 text-left space-y-2 mb-6">
        <p className="font-display text-xl tracking-wide">{booking.showtime.movie.title}</p>
        <p className="text-sm text-text-muted">
          {format(booking.showtime.startTime, "MMMM d '·' h:mm a")}
        </p>
        <p className="text-sm text-text-muted">
          {booking.showtime.cinema.name} · {booking.showtime.screen.name} · {booking.showtime.format}
        </p>
        <p className="text-sm text-text-primary font-mono">Seats {seatLabels}</p>
        <p className="pt-2 text-xs uppercase tracking-wide text-text-muted">Booking ID</p>
        <p className="font-mono text-lg text-marquee-gold">{booking.bookingRef}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/booking/${showtimeId}/ticket?booking=${booking.id}`}
          className="rounded-md bg-marquee-gold py-3 text-sm font-semibold text-bg hover:brightness-110 transition"
        >
          View Ticket
        </Link>
        <button className="flex items-center justify-center gap-2 rounded-md border border-border py-3 text-sm hover:bg-bg-card transition">
          <Wallet className="h-4 w-4" />
          Add to Wallet
        </button>
        <button className="flex items-center justify-center gap-2 rounded-md border border-border py-3 text-sm hover:bg-bg-card transition">
          <Navigation className="h-4 w-4" />
          Get Directions
        </button>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-md border border-border py-3 text-sm hover:bg-bg-card transition"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
