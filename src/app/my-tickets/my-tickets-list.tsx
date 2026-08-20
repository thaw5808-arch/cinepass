"use client";

import { useState } from "react";
import Link from "next/link";
import { QrCode, X } from "lucide-react";
import { cancelBookingAction } from "@/lib/actions/booking";

const TABS = ["Upcoming", "Completed", "Cancelled"] as const;
type Tab = (typeof TABS)[number];

export type TicketSummary = {
  bookingId: string;
  showtimeId: string;
  ref: string;
  movie: string;
  cinema: string;
  date: string;
  time: string;
  seats: string;
};

export function MyTicketsList({
  upcoming: initialUpcoming,
  completed,
  cancelled: initialCancelled,
}: {
  upcoming: TicketSummary[];
  completed: TicketSummary[];
  cancelled: TicketSummary[];
}) {
  const [tab, setTab] = useState<Tab>("Upcoming");
  const [upcoming, setUpcoming] = useState(initialUpcoming);
  const [cancelled, setCancelled] = useState(initialCancelled);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelBooking = async (bookingId: string) => {
    setError(null);
    setCancellingId(bookingId);
    const result = await cancelBookingAction(bookingId);
    setCancellingId(null);
    setConfirmingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const booking = upcoming.find((b) => b.bookingId === bookingId);
    if (!booking) return;
    setUpcoming((prev) => prev.filter((b) => b.bookingId !== bookingId));
    setCancelled((prev) => [booking, ...prev]);
  };

  const list = tab === "Upcoming" ? upcoming : tab === "Cancelled" ? cancelled : completed;

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-marquee-gold text-marquee-gold"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-velvet-red-bright/60 bg-velvet-red-bright/10 px-4 py-2.5 text-sm text-velvet-red-bright">
          {error}
        </p>
      )}

      {list.length === 0 ? (
        <p className="text-text-muted text-sm py-16 text-center">
          {tab === "Upcoming"
            ? "You don't have any upcoming tickets."
            : `No ${tab.toLowerCase()} tickets.`}
        </p>
      ) : (
        <div className="space-y-4">
          {list.map((t) => (
            <div key={t.bookingId} className="rounded-lg border border-border bg-bg-elevated p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg tracking-wide">{t.movie}</h2>
                  <p className="text-sm text-text-muted">{t.cinema}</p>
                  <p className="text-sm text-text-muted">
                    {t.date} · {t.time} · Seats {t.seats}
                  </p>
                  <p className="mt-1 text-xs font-mono text-text-muted">Booking ID: {t.ref}</p>
                </div>
                <QrCode className="h-10 w-10 text-marquee-gold shrink-0" />
              </div>

              {tab === "Upcoming" && (
                <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                  <Link
                    href={`/booking/${t.showtimeId}/ticket?booking=${t.bookingId}`}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-bg-card transition"
                  >
                    View Ticket
                  </Link>
                  <button className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-bg-card transition">
                    Get Directions
                  </button>
                  {confirmingId === t.bookingId ? (
                    <span className="ml-auto flex items-center gap-2 text-xs">
                      <span className="text-text-muted">Cancel per policy — no refund inside 2h?</span>
                      <button
                        onClick={() => cancelBooking(t.bookingId)}
                        disabled={cancellingId === t.bookingId}
                        className="rounded-md bg-velvet-red-bright px-2.5 py-1 font-semibold text-text-primary disabled:opacity-60"
                      >
                        {cancellingId === t.bookingId ? "Cancelling…" : "Confirm"}
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        aria-label="Dismiss"
                        className="text-text-muted hover:text-text-primary"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(t.bookingId)}
                      className="ml-auto rounded-md px-3 py-1.5 text-xs font-semibold text-velvet-red-bright hover:bg-velvet-red-bright/10 transition"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
