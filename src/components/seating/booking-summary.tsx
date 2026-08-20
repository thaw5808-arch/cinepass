"use client";

import type { SeatMapSeat } from "./seat-map";

export function BookingSummary({
  movieTitle,
  cinemaName,
  screenName,
  showtimeLabel,
  selectedSeats,
  onContinue,
}: {
  movieTitle: string;
  cinemaName: string;
  screenName: string;
  showtimeLabel: string;
  selectedSeats: SeatMapSeat[];
  onContinue?: () => void;
}) {
  const total = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="sticky bottom-0 lg:bottom-auto lg:top-24 rounded-lg border border-border bg-bg-elevated p-5 space-y-4">
      <div>
        <h3 className="font-display text-xl tracking-wide">{movieTitle}</h3>
        <p className="text-sm text-text-muted">
          {cinemaName} · {screenName}
        </p>
        <p className="text-sm text-text-muted">{showtimeLabel}</p>
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Seats</p>
        {selectedSeats.length === 0 ? (
          <p className="text-sm text-text-muted">No seats selected yet</p>
        ) : (
          <p className="font-mono text-sm text-text-primary">
            {selectedSeats
              .slice()
              .sort((a, b) => (a.row + a.number).localeCompare(b.row + b.number))
              .map((s) => `${s.row}${s.number}`)
              .join(", ")}
          </p>
        )}
      </div>

      <div className="border-t border-border pt-3 flex items-baseline justify-between">
        <span className="text-sm text-text-muted">
          {selectedSeats.length} × ticket{selectedSeats.length === 1 ? "" : "s"}
        </span>
        <span className="font-display text-2xl text-marquee-gold">฿{total.toFixed(0)}</span>
      </div>

      <button
        type="button"
        disabled={selectedSeats.length === 0}
        onClick={onContinue}
        className="w-full rounded-md bg-marquee-gold py-3 text-sm font-semibold text-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}
