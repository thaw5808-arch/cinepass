import type { SeatMapSeat, SeatCategory } from "@/components/seating/seat-map";

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const SEATS_PER_ROW = 14;

function categoryFor(rowIndex: number, col: number): SeatCategory {
  const row = ROWS[rowIndex];
  if (row === "H" && (col === 6 || col === 7 || col === 8 || col === 9)) return "COUPLE";
  if (row === "A" && (col === 1 || col === 14)) return "ACCESSIBLE";
  if (rowIndex >= 5) return "VIP"; // back rows
  if (rowIndex >= 2) return "PREMIUM"; // middle rows
  return "STANDARD"; // front rows
}

function priceFor(category: SeatCategory, basePrice: number) {
  switch (category) {
    case "VIP":
      return basePrice + 120;
    case "PREMIUM":
      return basePrice + 60;
    case "COUPLE":
      return basePrice * 2 + 80;
    default:
      return basePrice;
  }
}

/** Deterministic pseudo-random "already booked / held" seats so the demo looks alive. */
function statusFor(id: string): "AVAILABLE" | "HELD" | "BOOKED" {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 97;
  if (hash < 12) return "BOOKED";
  if (hash < 16) return "HELD";
  return "AVAILABLE";
}

export function generateMockSeats(basePrice = 200): SeatMapSeat[] {
  const seats: SeatMapSeat[] = [];
  ROWS.forEach((row, rowIndex) => {
    for (let col = 1; col <= SEATS_PER_ROW; col++) {
      const category = categoryFor(rowIndex, col);
      const id = `${row}${col}`;
      seats.push({
        id,
        row,
        number: col,
        posX: col,
        posY: rowIndex,
        category,
        status: statusFor(id),
        price: priceFor(category, basePrice),
      });
    }
  });
  return seats;
}

export const MOCK_SHOWTIME = {
  movieTitle: "Avatar: The Seed Bearer",
  cinemaName: "CinePass CentralWorld",
  screenName: "Screen 5 · IMAX",
  showtimeLabel: "August 25 · 7:30 PM",
  basePrice: 200,
};
