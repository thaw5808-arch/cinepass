"use client";

import { useState } from "react";
import { QrCode, X } from "lucide-react";

const TABS = ["Upcoming", "Completed", "Cancelled"] as const;
type Tab = (typeof TABS)[number];

const INITIAL_UPCOMING = [
  {
    movie: "Avatar: The Seed Bearer",
    cinema: "CinePass CentralWorld",
    date: "August 25, 2026",
    time: "7:30 PM",
    seats: "D7, D8",
    ref: "CX8F92K1",
  },
];

export default function MyTicketsPage() {
  const [tab, setTab] = useState<Tab>("Upcoming");
  const [upcoming, setUpcoming] = useState(INITIAL_UPCOMING);
  const [cancelled, setCancelled] = useState<typeof INITIAL_UPCOMING>([]);
  const [confirmingRef, setConfirmingRef] = useState<string | null>(null);

  const cancelBooking = (ref: string) => {
    const booking = upcoming.find((b) => b.ref === ref);
    if (!booking) return;
    setUpcoming((prev) => prev.filter((b) => b.ref !== ref));
    setCancelled((prev) => [...prev, booking]);
    setConfirmingRef(null);
  };

  const list = tab === "Upcoming" ? upcoming : tab === "Cancelled" ? cancelled : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl tracking-wide mb-6">My Tickets</h1>

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

      {list.length === 0 ? (
        <p className="text-text-muted text-sm py-16 text-center">
          {tab === "Upcoming"
            ? "You don't have any upcoming tickets."
            : `No ${tab.toLowerCase()} tickets.`}
        </p>
      ) : (
        <div className="space-y-4">
          {list.map((t) => (
            <div
              key={t.ref}
              className="rounded-lg border border-border bg-bg-elevated p-5"
            >
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
                  <button className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-bg-card transition">
                    View Ticket
                  </button>
                  <button className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-bg-card transition">
                    Get Directions
                  </button>
                  {confirmingRef === t.ref ? (
                    <span className="ml-auto flex items-center gap-2 text-xs">
                      <span className="text-text-muted">Cancel per policy — no refund inside 2h?</span>
                      <button
                        onClick={() => cancelBooking(t.ref)}
                        className="rounded-md bg-velvet-red-bright px-2.5 py-1 font-semibold text-text-primary"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmingRef(null)}
                        aria-label="Dismiss"
                        className="text-text-muted hover:text-text-primary"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmingRef(t.ref)}
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
