# CinePass — Cinema Ticket Booking Platform

Foundation scaffold: Next.js 16 (App Router, TS, Tailwind v4) + Prisma/PostgreSQL, built from the
full booking-flow spec (discover → seats → food → checkout → payment → QR ticket → admin).

## What's built

- **Prisma schema** (`prisma/schema.prisma`) — every entity from the spec: users/roles, movies,
  cinemas/screens/seats, showtimes, per-showtime seat state (`ShowtimeSeat`), bookings, payments,
  tickets/QR, food & beverage, promotions, notifications.
- **Seat locking** (`src/lib/seat-locking.ts`) — `holdSeats` / `releaseSeats` / `confirmSeats` /
  `releaseBookedSeats`, all using conditional `updateMany` inside transactions so two users racing
  for the same seat can't both win. This is the piece the whole booking flow depends on.
- **Pricing** (`src/lib/pricing.ts`) — centralized totals/discount/booking-fee math and booking
  reference generation, so nothing computes a total a second, divergent way.
- **Seat recommendation** (`src/lib/seat-recommendation.ts`) — "Find My Best Seats" contiguous-block
  scoring by centrality + screen distance.
- **UI**: cinematic dark theme (`globals.css`) — Bebas Neue display / Inter body / IBM Plex Mono for
  codes, sprocket-hole section dividers, marquee-gold + velvet-red accents. Navbar, homepage hero +
  rails, movie details, cinema list, seat map (the core interactive piece — click to select, live
  hold countdown, category legend, "Find My Best Seats"), booking summary, checkout, my tickets,
  offers, profile, and an admin dashboard shell.

The seat map and booking pages currently run on **mock data** (`src/lib/mock-showtime.ts`,
`src/lib/mock-movies.ts`) so the UI is demoable without a database. Swap those calls for real
Prisma queries + the `seat-locking.ts` functions once the DB is connected — that's the natural next
step.

## Also built (phase 2)

- **Full booking flow wired end-to-end** via `src/lib/booking-context.tsx`, shared by
  `/booking/[showtimeId]/{seats,food,checkout,payment,confirmation,ticket}` — seat selection, food
  cart, checkout totals, a simulated payment step (success/decline), confirmation, and a digital
  ticket all read from one client-side state so the numbers agree at every step.
- **Food & beverage cart** (`/booking/[showtimeId]/food`) — quantity steppers, remove, skippable.
- **Payment page** — method selection (card/QR/bank/wallet), pending/failed states, seats stay held
  on a simulated decline so the user can retry.
- **Digital ticket with a real QR code** (`src/components/tickets/qr-code-image.tsx`, using the
  `qrcode` package) encoding the booking ref client-side.
- **Staff ticket validation** (`/staff/validate`) — VALID / TICKET ALREADY USED / INVALID states;
  demo data lives in-memory, real version swaps in a Ticket lookup + the same conditional-update
  pattern as `seat-locking.ts` so a ticket can't be scanned valid twice.
- **Cancellation flow** on `/my-tickets` — inline confirm, moves a booking to the Cancelled tab.
- **Admin movies CRUD list** (`/admin/movies`) as the reference pattern for the rest of the admin
  screens (cinemas, screens, showtimes, bookings, reports).

## Not yet built

Real payment gateway integration (current one simulates success/decline), promo code validation,
refund processing, real auth/session, and CRUD screens for cinemas/screens/showtimes/bookings/food
items/promotions in admin (movies is the reference pattern — same table+actions shape). The schema
and seat-locking logic already model all of these, so each is wiring a page to existing Prisma
models rather than new design.

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL (Neon) and SEAT_HOLD_MINUTES
npx prisma generate
npx prisma db push     # or migrate dev, once you're ready for real migrations
npm run dev
```

`npx prisma generate` needs network access to Prisma's binary host — it will fail in a sandboxed
environment with no internet, but works normally on your machine.
