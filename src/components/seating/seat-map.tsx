"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Accessibility, AlertCircle, Heart, Sparkles } from "lucide-react";
import { recommendSeats, type SeatForRecommendation } from "@/lib/seat-recommendation";
import { holdSeatsAction, releaseSeatsAction } from "@/lib/actions/seats";

export type SeatCategory = "STANDARD" | "PREMIUM" | "VIP" | "ACCESSIBLE" | "COUPLE";
export type SeatState = "AVAILABLE" | "SELECTED" | "OCCUPIED" | "HELD" | "BLOCKED";

export type SeatMapSeat = {
  id: string; // showtimeSeat id
  row: string;
  number: number;
  posX: number;
  posY: number;
  category: SeatCategory;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
  price: number;
};

const CATEGORY_LABEL: Record<SeatCategory, string> = {
  STANDARD: "Standard",
  PREMIUM: "Premium",
  VIP: "VIP",
  ACCESSIBLE: "Accessible",
  COUPLE: "Couple",
};

function seatClasses(category: SeatCategory, isSelected: boolean, isTaken: boolean, isPending: boolean) {
  if (isTaken) return "bg-bg-card border-border text-text-muted/40 cursor-not-allowed";
  if (isSelected) return "bg-marquee-gold border-marquee-gold text-bg";
  if (isPending) return "bg-transparent border-marquee-gold-dim text-marquee-gold opacity-60 cursor-wait";

  switch (category) {
    case "VIP":
      return "bg-transparent border-marquee-gold-dim text-marquee-gold hover:bg-marquee-gold/10";
    case "PREMIUM":
      return "bg-transparent border-velvet-red-bright text-velvet-red-bright hover:bg-velvet-red-bright/10";
    case "COUPLE":
      return "bg-transparent border-screen-glow text-screen-glow hover:bg-screen-glow/10";
    default:
      return "bg-transparent border-border text-text-muted hover:border-text-primary hover:text-text-primary";
  }
}

export function SeatMap({
  seats,
  showtimeId,
  maxSeats = 10,
  onSelectionChange,
}: {
  seats: SeatMapSeat[];
  /** Showtime these seats belong to — required to hold/release against the server. */
  showtimeId: string;
  maxSeats?: number;
  onSelectionChange?: (selected: SeatMapSeat[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Seats a hold/release request is in flight for — disabled and can't be double-clicked.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  // Seats the server told us are already taken, learned only after we tried
  // to hold them — the initial `seats` prop is a snapshot from page load
  // and never reflects another customer's hold made since.
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set());
  // Per-seat hold deadline, keyed by seat id, as returned by holdSeatsAction.
  const [holdExpiries, setHoldExpiries] = useState<Map<string, string>>(new Map());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [wantCount, setWantCount] = useState(2);

  // The countdown shows the soonest of the current holds to lapse — ISO
  // 8601 timestamps sort lexicographically in chronological order.
  const holdExpiresAt = useMemo(() => {
    let soonest: string | null = null;
    for (const expiresAt of holdExpiries.values()) {
      if (soonest === null || expiresAt < soonest) soonest = expiresAt;
    }
    return soonest;
  }, [holdExpiries]);

  // Ticks once a second while a hold is active; secondsLeft below is derived
  // from it during render rather than stored as its own state.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!holdExpiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [holdExpiresAt]);

  const secondsLeft = holdExpiresAt
    ? Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - now) / 1000))
    : null;

  const rows = useMemo(() => {
    const byRow = new Map<string, SeatMapSeat[]>();
    for (const s of seats) {
      if (!byRow.has(s.row)) byRow.set(s.row, []);
      byRow.get(s.row)!.push(s);
    }
    return Array.from(byRow.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([row, list]) => [row, list.sort((a, b) => a.posX - b.posX)] as const);
  }, [seats]);

  /**
   * Selecting: waits for holdSeatsAction() to confirm the hold server-side
   * before the seat turns gold. On conflict, the seat is marked taken and
   * an error surfaces instead — it never gets an optimistic "selected".
   *
   * Deselecting: releases the hold immediately (not left to expire on its
   * own) so the seat is grabbable by someone else right away.
   */
  const toggleSeat = useCallback(
    async (seat: SeatMapSeat) => {
      if (pendingIds.has(seat.id)) return;

      const isSelected = selectedIds.has(seat.id);
      const isTaken = !isSelected && (takenIds.has(seat.id) || seat.status !== "AVAILABLE");
      if (isTaken) return;

      setPendingIds((prev) => new Set(prev).add(seat.id));

      if (isSelected) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(seat.id);
          return next;
        });
        setHoldExpiries((prev) => {
          const next = new Map(prev);
          next.delete(seat.id);
          return next;
        });
        try {
          await releaseSeatsAction([seat.id]);
        } finally {
          setPendingIds((prev) => {
            const next = new Set(prev);
            next.delete(seat.id);
            return next;
          });
        }
        return;
      }

      if (selectedIds.size >= maxSeats) {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(seat.id);
          return next;
        });
        return;
      }

      setErrorMessage(null);
      const result = await holdSeatsAction(showtimeId, [seat.id]);
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(seat.id);
        return next;
      });

      if (result.ok) {
        setSelectedIds((prev) => new Set(prev).add(seat.id));
        setHoldExpiries((prev) => new Map(prev).set(seat.id, result.holdExpiresAt));
      } else {
        setTakenIds((prev) => {
          const next = new Set(prev);
          for (const id of result.conflictIds ?? [seat.id]) next.add(id);
          return next;
        });
        setErrorMessage(result.error);
      }
    },
    [pendingIds, selectedIds, takenIds, maxSeats, showtimeId]
  );

  const findBestSeats = useCallback(async () => {
    const forRec: SeatForRecommendation[] = seats.map((s) => ({
      id: s.id,
      row: s.row,
      number: s.number,
      posX: s.posX,
      posY: s.posY,
      status: takenIds.has(s.id) ? "HELD" : s.status,
    }));
    const best = recommendSeats(forRec, wantCount);
    if (!best) return;

    const previousIds = Array.from(selectedIds);
    const newIds = best.map((s) => s.id);

    setErrorMessage(null);
    setPendingIds((prev) => {
      const next = new Set(prev);
      for (const id of [...previousIds, ...newIds]) next.add(id);
      return next;
    });

    // Give up whatever this session currently holds before atomically
    // holding the recommended set, so the old seats don't sit locked until
    // their timer expires.
    if (previousIds.length > 0) await releaseSeatsAction(previousIds);
    const result = await holdSeatsAction(showtimeId, newIds);

    setPendingIds((prev) => {
      const next = new Set(prev);
      for (const id of [...previousIds, ...newIds]) next.delete(id);
      return next;
    });

    if (result.ok) {
      setSelectedIds(new Set(newIds));
      setHoldExpiries(new Map(newIds.map((id) => [id, result.holdExpiresAt])));
    } else {
      setSelectedIds(new Set());
      setHoldExpiries(new Map());
      setTakenIds((prev) => {
        const next = new Set(prev);
        for (const id of result.conflictIds ?? newIds) next.add(id);
        return next;
      });
      setErrorMessage(result.error);
    }
  }, [seats, takenIds, wantCount, selectedIds, showtimeId]);

  // Notify the parent after commit, not from inside the setSelectedIds
  // updater — calling onSelectionChange during SeatMap's own render phase
  // synchronously updates BookingProvider's state and triggers React's
  // "Cannot update a component while rendering a different component".
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    onSelectionChange?.(seats.filter((s) => selectedIds.has(s.id)));
  }, [selectedIds, seats]);

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : null;
  const secs = secondsLeft !== null ? secondsLeft % 60 : null;
  const urgentHold = secondsLeft !== null && secondsLeft < 120;

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-velvet-red-bright/60 bg-velvet-red-bright/10 px-4 py-3 text-sm text-velvet-red-bright"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {secondsLeft !== null && (
        <div
          className={`flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-mono ${
            urgentHold
              ? "border-velvet-red-bright text-velvet-red-bright"
              : "border-border text-text-muted"
          }`}
          role="status"
        >
          Seats reserved for {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
      )}

      {/* Screen */}
      <div className="flex flex-col items-center pt-4 pb-8">
        <div
          className="h-2 w-full max-w-2xl rounded-full"
          style={{
            background: "var(--screen-glow)",
            boxShadow: "0 0 40px 8px var(--screen-glow)",
            opacity: 0.55,
          }}
        />
        <span className="mt-3 text-xs tracking-[0.3em] text-text-muted">SCREEN</span>
      </div>

      {/* Seat grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-2 mx-auto min-w-full items-center">
          {rows.map(([row, rowSeats]) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-5 text-xs text-text-muted font-mono">{row}</span>
              <div className="flex gap-1.5">
                {rowSeats.map((seat) => {
                  const isSelected = selectedIds.has(seat.id);
                  const isPending = pendingIds.has(seat.id);
                  const isTaken = !isSelected && (takenIds.has(seat.id) || seat.status !== "AVAILABLE");
                  const label = `Seat ${seat.row}${seat.number}, ${CATEGORY_LABEL[seat.category]}, ${
                    isTaken
                      ? "temporarily reserved or occupied"
                      : isPending
                      ? isSelected
                        ? "releasing"
                        : "holding"
                      : isSelected
                      ? "selected"
                      : "available"
                  }`;
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-pressed={isSelected}
                      aria-busy={isPending}
                      disabled={isTaken || isPending}
                      onClick={() => toggleSeat(seat)}
                      className={`relative flex h-8 w-8 items-center justify-center rounded-t-md rounded-b-sm border text-[10px] font-mono transition-colors ${seatClasses(
                        seat.category,
                        isSelected,
                        isTaken,
                        isPending
                      )}`}
                    >
                      {seat.category === "ACCESSIBLE" ? (
                        <Accessibility className="h-3.5 w-3.5" />
                      ) : seat.category === "COUPLE" ? (
                        <Heart className="h-3 w-3" />
                      ) : isTaken ? (
                        "×"
                      ) : (
                        seat.number
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend — shape/label based, not color-only */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-text-muted">
        <LegendItem swatchClass="border-border" label="Available" />
        <LegendItem swatchClass="bg-marquee-gold border-marquee-gold" label="Selected" />
        <LegendItem swatchClass="bg-bg-card border-border" label="Occupied (×)" />
        <LegendItem swatchClass="border-velvet-red-bright" label="Premium" />
        <LegendItem swatchClass="border-marquee-gold-dim" label="VIP" />
      </div>

      {/* Find My Best Seats */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-border bg-bg-elevated p-4">
        <Sparkles className="h-4 w-4 text-marquee-gold shrink-0" />
        <span className="text-sm text-text-primary">Find My Best Seats</span>
        <select
          value={wantCount}
          onChange={(e) => setWantCount(Number(e.target.value))}
          className="rounded-md border border-border bg-bg px-2 py-1 text-sm text-text-primary"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} seat{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={findBestSeats}
          className="rounded-md bg-marquee-gold px-3 py-1.5 text-sm font-semibold text-bg hover:brightness-110"
        >
          Select These Seats
        </button>
      </div>
    </div>
  );
}

function LegendItem({ swatchClass, label }: { swatchClass: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-4 w-4 rounded-t-sm rounded-b-[2px] border ${swatchClass}`} />
      {label}
    </span>
  );
}
