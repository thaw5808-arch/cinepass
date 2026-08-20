// Seed script for local/dev data — creates a handful of movies, one cinema
// with two screens (with a physical seat layout matching
// src/lib/mock-showtime.ts), a run of showtimes for the next few days, and
// the food & beverage catalog from src/lib/mock-food.ts.
//
// Safe to re-run: it wipes the rows it owns (in FK-safe order) before
// re-inserting, rather than upserting against compound keys.
//
// Run with: npx prisma db seed  (or: npx tsx prisma/seed.ts)

import "dotenv/config";
import { PrismaClient, type SeatCategory, type SeatStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ────────────────────────────────
// Source data (mirrors src/lib/mock-movies.ts / mock-food.ts, extended
// with the extra fields the Movie model requires but the mock type doesn't
// carry — director, cast, subtitles, trailer, release date, status).
// ────────────────────────────────

const MOVIES = [
  {
    slug: "avatar-seed-bearer",
    title: "Avatar: The Seed Bearer",
    genres: ["Sci-Fi", "Adventure"],
    durationMins: 162,
    rating: 8.5,
    ageRating: "PG-13",
    language: "English",
    subtitles: ["Thai", "Chinese"],
    director: "James Cameron",
    cast: ["Sam Worthington", "Zoe Saldaña", "Sigourney Weaver"],
    posterUrl: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=600&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=1600&q=80",
    trailerUrl: null,
    synopsis: "The Sully family faces a new threat that pulls them beyond the reefs of Pandora.",
    releaseDate: new Date("2026-08-14"),
    status: "NOW_SHOWING" as const,
  },
  {
    slug: "midnight-heist",
    title: "The Midnight Heist",
    genres: ["Action", "Thriller"],
    durationMins: 128,
    rating: 7.8,
    ageRating: "R",
    language: "English",
    subtitles: ["Thai"],
    director: "Ana Reyes",
    cast: ["Idris Elba", "Florence Pugh", "John Cho"],
    posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&q=80",
    trailerUrl: null,
    synopsis: "Six strangers, one vault, and twelve minutes before the doors seal for good.",
    releaseDate: new Date("2026-08-07"),
    status: "NOW_SHOWING" as const,
  },
  {
    slug: "paper-lanterns",
    title: "Paper Lanterns",
    genres: ["Drama", "Romance"],
    durationMins: 114,
    rating: 8.1,
    ageRating: "PG",
    language: "Thai",
    subtitles: ["English"],
    director: "Naruemon Chai",
    cast: ["Davika Hoorne", "Mario Maurer"],
    posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1600&q=80",
    trailerUrl: null,
    synopsis: "A festival of floating lights becomes the backdrop for a decade-late reunion.",
    releaseDate: new Date("2026-07-31"),
    status: "NOW_SHOWING" as const,
  },
  {
    slug: "iron-horizon",
    title: "Iron Horizon",
    genres: ["Sci-Fi", "Action"],
    durationMins: 141,
    rating: 7.4,
    ageRating: "PG-13",
    language: "English",
    subtitles: ["Thai", "Chinese"],
    director: "Marcus Lindqvist",
    cast: ["Oscar Isaac", "Letitia Wright"],
    posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600&q=80",
    trailerUrl: null,
    synopsis: "Earth's last shipyard races to launch before the horizon fleet arrives.",
    releaseDate: new Date("2026-08-11"),
    status: "NOW_SHOWING" as const,
  },
  {
    slug: "glass-orchard",
    title: "The Glass Orchard",
    genres: ["Fantasy"],
    durationMins: 132,
    rating: 0,
    ageRating: "PG-13",
    language: "English",
    subtitles: ["Thai"],
    director: "Priya Nathan",
    cast: ["Anya Taylor-Joy", "Barry Keoghan"],
    posterUrl: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1600&q=80",
    trailerUrl: null,
    synopsis: "An orchard that only blooms once a century hides a door between worlds.",
    releaseDate: new Date("2026-09-18"),
    status: "COMING_SOON" as const,
  },
];

const CINEMA = {
  slug: "centralworld",
  name: "CinePass CentralWorld",
  address: "999/9 Rama I Rd, Pathum Wan",
  city: "Bangkok",
  latitude: 13.7466,
  longitude: 100.5393,
  formats: ["IMAX", "VIP", "DOLBY_ATMOS"],
};

const SCREENS = [
  { name: "Screen 5", type: "IMAX" as const, format: "IMAX", basePrice: 260 },
  { name: "Screen 2", type: "STANDARD" as const, format: "2D", basePrice: 180 },
];

const SHOWTIME_SLOTS = ["13:20", "16:15", "19:30", "22:10"];

const FOOD_CATALOG = [
  { id: "popcorn-large", name: "Large Popcorn", category: "POPCORN" as const, price: 150 },
  { id: "popcorn-caramel", name: "Caramel Popcorn", category: "POPCORN" as const, price: 170 },
  { id: "coke", name: "Coke", category: "DRINKS" as const, price: 50 },
  { id: "iced-tea", name: "Thai Iced Tea", category: "DRINKS" as const, price: 65 },
  { id: "nachos", name: "Loaded Nachos", category: "SNACKS" as const, price: 130 },
  { id: "hotdog", name: "Classic Hot Dog", category: "HOT_FOOD" as const, price: 110 },
  { id: "combo-duo", name: "Duo Combo", category: "COMBOS" as const, price: 280 },
];

// ────────────────────────────────
// Seat layout — mirrors src/lib/mock-showtime.ts exactly so the seed data
// lines up with the seat map's demo category logic.
// ────────────────────────────────

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

function priceFor(category: SeatCategory, basePrice: number): number {
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

/** Same deterministic pseudo-random hold/booked pattern the seat map mock uses. */
function statusFor(id: string): SeatStatus {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 97;
  if (hash < 12) return "BOOKED";
  if (hash < 16) return "HELD";
  return "AVAILABLE";
}

async function main() {
  console.log("Seeding CinePass...");

  // Wipe in FK-safe order (children before parents) so this is re-runnable.
  await prisma.showtimeSeat.deleteMany();
  await prisma.showtime.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.cinema.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.foodOrderItem.deleteMany();
  await prisma.foodItem.deleteMany();

  // ── Movies ──
  const movies = await Promise.all(
    MOVIES.map((m) => prisma.movie.create({ data: m }))
  );
  console.log(`  ${movies.length} movies`);

  // ── Cinema + screens ──
  const cinema = await prisma.cinema.create({ data: CINEMA });

  const screens = await Promise.all(
    SCREENS.map((s) =>
      prisma.screen.create({
        data: {
          cinemaId: cinema.id,
          name: s.name,
          type: s.type,
          capacity: ROWS.length * SEATS_PER_ROW,
        },
      })
    )
  );
  console.log(`  1 cinema, ${screens.length} screens`);

  // ── Seats per screen ──
  let seatCount = 0;
  const seatsByScreen = new Map<string, { id: string; row: string; number: number; category: SeatCategory }[]>();
  for (const screen of screens) {
    const seatRows: { screenId: string; row: string; number: number; category: SeatCategory; posX: number; posY: number }[] = [];
    ROWS.forEach((row, rowIndex) => {
      for (let col = 1; col <= SEATS_PER_ROW; col++) {
        seatRows.push({
          screenId: screen.id,
          row,
          number: col,
          category: categoryFor(rowIndex, col),
          posX: col,
          posY: rowIndex,
        });
      }
    });
    await prisma.seat.createMany({ data: seatRows });
    const created = await prisma.seat.findMany({
      where: { screenId: screen.id },
      select: { id: true, row: true, number: true, category: true },
    });
    seatsByScreen.set(screen.id, created);
    seatCount += created.length;
  }
  console.log(`  ${seatCount} seats`);

  // ── Showtimes (next 3 days, a couple of slots per movie/screen) ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let showtimeCount = 0;
  let showtimeSeatCount = 0;

  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    for (const [movieIndex, movie] of movies.filter((m) => m.status === "NOW_SHOWING").entries()) {
      const screen = screens[movieIndex % screens.length];
      const screenConfig = SCREENS[movieIndex % screens.length];
      const slot = SHOWTIME_SLOTS[(movieIndex + dayOffset) % SHOWTIME_SLOTS.length];
      const [hours, minutes] = slot.split(":").map(Number);

      const startTime = new Date(today);
      startTime.setDate(startTime.getDate() + dayOffset);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime.getTime() + movie.durationMins * 60 * 1000);

      const showtime = await prisma.showtime.create({
        data: {
          movieId: movie.id,
          cinemaId: cinema.id,
          screenId: screen.id,
          startTime,
          endTime,
          format: screenConfig.format,
          language: movie.language,
          subtitle: movie.subtitles[0] ?? null,
          basePrice: screenConfig.basePrice,
        },
      });
      showtimeCount++;

      const seats = seatsByScreen.get(screen.id)!;
      await prisma.showtimeSeat.createMany({
        data: seats.map((seat) => ({
          showtimeId: showtime.id,
          seatId: seat.id,
          status: statusFor(`${showtime.id}:${seat.row}${seat.number}`),
          price: priceFor(seat.category, screenConfig.basePrice),
        })),
      });
      showtimeSeatCount += seats.length;
    }
  }
  console.log(`  ${showtimeCount} showtimes, ${showtimeSeatCount} showtime seats`);

  // ── Food & beverage catalog ──
  await prisma.foodItem.createMany({
    data: FOOD_CATALOG.map((f) => ({
      id: f.id,
      name: f.name,
      category: f.category,
      price: f.price,
    })),
  });
  console.log(`  ${FOOD_CATALOG.length} food items`);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
