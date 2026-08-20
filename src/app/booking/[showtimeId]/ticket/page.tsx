"use client";

import Image from "next/image";
import { useBooking } from "@/lib/booking-context";
import { QrCodeImage } from "@/components/tickets/qr-code-image";

export default function TicketPage() {
  const { showtime, selectedSeats, foodCart, bookingRef } = useBooking();

  const seatLabels = selectedSeats
    .slice()
    .sort((a, b) => (a.row + a.number).localeCompare(b.row + b.number))
    .map((s) => `${s.row}${s.number}`)
    .join(" · ");

  // The QR encodes the booking ref — a real build should encode Ticket.qrToken
  // (a separate opaque id from Prisma), not the human-facing booking ref.
  const qrValue = `cinepass:ticket:${bookingRef}`;

  return (
    <div className="mx-auto max-w-sm">
      <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated">
        <div className="relative h-40 w-full">
          <Image src={showtime.posterUrl} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-elevated via-bg-elevated/40 to-transparent" />
          <p className="absolute bottom-3 left-4 font-display text-2xl tracking-wide">
            {showtime.movieTitle}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Date & Time" value={showtime.showtimeLabel} />
            <Field label="Screen" value={showtime.screenName} />
            <Field label="Cinema" value={showtime.cinemaName} />
            <Field label="Seats" value={seatLabels || "—"} />
          </div>

          {foodCart.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Food Order</p>
              <p className="text-sm text-text-primary">
                {foodCart.map((f) => `${f.name} ×${f.quantity}`).join(", ")}
              </p>
            </div>
          )}
        </div>

        <div className="sprocket-divider" />

        <div className="flex flex-col items-center gap-3 p-6">
          <QrCodeImage value={qrValue} />
          <p className="font-mono text-sm text-marquee-gold">Booking ID: {bookingRef}</p>
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
