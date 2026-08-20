"use client";

import { useRouter } from "next/navigation";
import { SeatMap, type SeatMapSeat } from "@/components/seating/seat-map";
import { BookingSummary } from "@/components/seating/booking-summary";
import { useBooking } from "@/lib/booking-context";

export function SeatSelection({ seats }: { seats: SeatMapSeat[] }) {
  const router = useRouter();
  const { showtime, selectedSeats, setSelectedSeats } = useBooking();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide mb-1">Choose Your Seats</h1>
      <p className="text-sm text-text-muted mb-8">
        {showtime.movieTitle} · {showtime.cinemaName}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <SeatMap
          seats={seats}
          showtimeId={showtime.showtimeId}
          onSelectionChange={setSelectedSeats}
        />
        <BookingSummary
          movieTitle={showtime.movieTitle}
          cinemaName={showtime.cinemaName}
          screenName={showtime.screenName}
          showtimeLabel={showtime.showtimeLabel}
          selectedSeats={selectedSeats}
          onContinue={() => router.push(`/booking/${showtime.showtimeId}/food`)}
        />
      </div>
    </div>
  );
}
