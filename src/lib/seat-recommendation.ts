export type SeatForRecommendation = {
  id: string;
  row: string;
  number: number;
  posX: number;
  posY: number;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
};

/**
 * Recommends the best contiguous block of `count` available seats.
 * Score rewards horizontal centrality and a screen distance sweet spot
 * (not front-row-close, not back-row-far) — roughly the middle third
 * of the room reads as the best view.
 */
export function recommendSeats(
  seats: SeatForRecommendation[],
  count: number
): SeatForRecommendation[] | null {
  const rows = Array.from(new Set(seats.map((s) => s.posY))).sort((a, b) => a - b);
  const maxCol = Math.max(...seats.map((s) => s.posX));
  const centerCol = maxCol / 2;
  const idealRowIndex = rows.length * 0.55; // slightly back of center is the sweet spot

  let best: SeatForRecommendation[] | null = null;
  let bestScore = -Infinity;

  for (const row of rows) {
    const rowSeats = seats
      .filter((s) => s.posY === row && s.status === "AVAILABLE")
      .sort((a, b) => a.posX - b.posX);

    for (let i = 0; i <= rowSeats.length - count; i++) {
      const block = rowSeats.slice(i, i + count);
      // Must be truly contiguous (no gap = another seat/aisle in between)
      const contiguous = block.every(
        (s, idx) => idx === 0 || s.posX === block[idx - 1].posX + 1
      );
      if (!contiguous) continue;

      const avgCol = block.reduce((sum, s) => sum + s.posX, 0) / block.length;
      const centerScore = -Math.abs(avgCol - centerCol);
      const rowScore = -Math.abs(rows.indexOf(row) - idealRowIndex);
      const score = centerScore * 2 + rowScore;

      if (score > bestScore) {
        bestScore = score;
        best = block;
      }
    }
  }

  return best;
}
