import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { QrCodeImage } from "@/components/tickets/qr-code-image";

export default async function TicketPage({
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
      foodOrder: { include: { items: { include: { foodItem: true } } } },
      ticket: true,
    },
  });

  if (!booking || booking.userId !== user.id || booking.showtimeId !== showtimeId || !booking.ticket) {
    notFound();
  }

  const seatLabels = booking.seats
    .map((bs) => bs.showtimeSeat.seat)
    .slice()
    .sort((a, b) => (a.row + String(a.number)).localeCompare(b.row + String(b.number)))
    .map((s) => `${s.row}${s.number}`)
    .join(" · ");

  // The QR encodes Ticket.qrToken — a separate opaque id from the
  // human-facing booking ref, so a leaked/photographed ticket can't be used
  // to look up the booking by anything guessable.
  const qrValue = `cinepass:ticket:${booking.ticket.qrToken}`;

  return (
    <div className="mx-auto max-w-sm">
      <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated">
        <div className="relative h-40 w-full">
          <Image src={booking.showtime.movie.posterUrl} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-elevated via-bg-elevated/40 to-transparent" />
          <p className="absolute bottom-3 left-4 font-display text-2xl tracking-wide">
            {booking.showtime.movie.title}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Date & Time" value={format(booking.showtime.startTime, "MMMM d '·' h:mm a")} />
            <Field label="Screen" value={`${booking.showtime.screen.name} · ${booking.showtime.format}`} />
            <Field label="Cinema" value={booking.showtime.cinema.name} />
            <Field label="Seats" value={seatLabels || "—"} />
          </div>

          {booking.foodOrder && booking.foodOrder.items.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Food Order</p>
              <p className="text-sm text-text-primary">
                {booking.foodOrder.items.map((i) => `${i.foodItem.name} ×${i.quantity}`).join(", ")}
              </p>
            </div>
          )}
        </div>

        <div className="sprocket-divider" />

        <div className="flex flex-col items-center gap-3 p-6">
          <QrCodeImage value={qrValue} />
          <p className="font-mono text-sm text-marquee-gold">Booking ID: {booking.bookingRef}</p>
          <p className="text-xs text-text-muted text-center">
            Show this code at the cinema entrance to be scanned in.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className="text-text-primary">{value}</p>
    </div>
  );
}
