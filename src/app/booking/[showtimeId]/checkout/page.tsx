"use client";

import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/booking-context";

export default function CheckoutPage() {
  const router = useRouter();
  const { showtime, selectedSeats, foodCart, ticketsTotal, foodTotal, bookingFee, total } =
    useBooking();

  const seatLabels = selectedSeats
    .slice()
    .sort((a, b) => (a.row + a.number).localeCompare(b.row + b.number))
    .map((s) => `${s.row}${s.number}`)
    .join(", ");

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl tracking-wide mb-8">Checkout</h1>

      <div className="rounded-lg border border-border bg-bg-elevated divide-y divide-border">
        <Row label="Movie" value={showtime.movieTitle} />
        <Row label="Cinema" value={showtime.cinemaName} />
        <Row label="Showtime" value={showtime.showtimeLabel} />
        <Row label="Screen" value={showtime.screenName} />
        <Row label="Seats" value={seatLabels || "No seats selected"} />
        <Row
          label="Food"
          value={
            foodCart.length === 0
              ? "None"
              : foodCart.map((f) => `${f.name} ×${f.quantity}`).join(", ")
          }
        />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-bg-elevated p-5">
        <PriceRow label="Tickets" amount={ticketsTotal} />
        <PriceRow label="Food" amount={foodTotal} />
        <PriceRow label="Booking fee" amount={bookingFee} />
        <div className="mt-3 flex justify-between border-t border-border pt-3">
          <span className="font-medium">Total</span>
          <span className="font-display text-2xl text-marquee-gold">฿{total.toFixed(0)}</span>
        </div>
      </div>

      <button
        type="button"
        disabled={selectedSeats.length === 0}
        onClick={() => router.push(`/booking/${showtime.showtimeId}/payment`)}
        className="mt-6 w-full rounded-md bg-marquee-gold py-3.5 text-sm font-semibold text-bg hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Proceed to Payment
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-5 py-3 text-sm">
      <span className="text-text-muted shrink-0">{label}</span>
      <span className="text-text-primary text-right">{value}</span>
    </div>
  );
}

function PriceRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between py-1.5 text-sm text-text-muted">
      <span>{label}</span>
      <span className="font-mono text-text-primary">฿{amount.toFixed(0)}</span>
    </div>
  );
}
