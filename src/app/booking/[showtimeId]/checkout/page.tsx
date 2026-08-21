"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/booking-context";
import { applyPromoCodeAction } from "@/lib/actions/promotions";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    showtime,
    selectedSeats,
    foodCart,
    ticketsTotal,
    foodTotal,
    bookingFee,
    discount,
    appliedPromo,
    setAppliedPromo,
    total,
  } = useBooking();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const seatLabels = selectedSeats
    .slice()
    .sort((a, b) => (a.row + a.number).localeCompare(b.row + b.number))
    .map((s) => `${s.row}${s.number}`)
    .join(", ");

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;

    setApplying(true);
    setPromoError(null);
    // Preview only — subtotal here is ticketsTotal + foodTotal (before the
    // booking fee), matching what confirmBookingAction re-checks minSpend
    // against at booking time. The discount this returns is never trusted
    // as the real charge; it's just what the checkout screen shows.
    const result = await applyPromoCodeAction(code, ticketsTotal + foodTotal);
    setApplying(false);

    if (!result.ok) {
      setPromoError(result.error);
      return;
    }
    setAppliedPromo({ code, discount: result.discount });
    setPromoInput("");
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError(null);
  };

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
        <h2 className="text-sm font-medium text-text-primary mb-3">Promo Code</h2>
        {appliedPromo ? (
          <div className="flex items-center justify-between rounded-md border border-marquee-gold/40 bg-marquee-gold/10 px-3.5 py-2.5 text-sm">
            <span className="font-mono text-marquee-gold">{appliedPromo.code}</span>
            <button
              type="button"
              onClick={handleRemovePromo}
              className="text-xs text-text-muted hover:text-velvet-red-bright"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Enter promo code"
              className="flex-1 rounded-md border border-border bg-bg-card px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-marquee-gold-dim"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={applying || !promoInput.trim()}
              className="shrink-0 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:border-marquee-gold hover:text-marquee-gold transition disabled:opacity-50"
            >
              {applying ? "Checking…" : "Apply"}
            </button>
          </div>
        )}
        {promoError && <p className="mt-2 text-xs text-velvet-red-bright">{promoError}</p>}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-bg-elevated p-5">
        <PriceRow label="Tickets" amount={ticketsTotal} />
        <PriceRow label="Food" amount={foodTotal} />
        <PriceRow label="Booking fee" amount={bookingFee} />
        {discount > 0 && (
          <div className="flex justify-between py-1.5 text-sm text-marquee-gold">
            <span>Discount ({appliedPromo?.code})</span>
            <span className="font-mono">-฿{discount.toFixed(0)}</span>
          </div>
        )}
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
