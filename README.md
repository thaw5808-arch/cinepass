# CinePass

A cinema ticket booking platform with real seat-level concurrency handling, role-based staff/admin tooling, and a full booking-to-refund lifecycle. Built solo, deployed to production.

Live: https://cinepass-three.vercel.app

## What it does

CinePass covers the full path a real cinema booking system needs, not just the customer-facing happy path:

- Browse movies and showtimes, pick a cinema, pick seats on a real seat map
- Add food and drinks, check out, pay (simulated payment gateway), get a QR ticket
- Cancel a booking and get refunded, with the seat released back into inventory
- Staff can scan or type in a booking ID to validate a ticket at the door
- Admins manage movies, cinemas, screens, showtimes, food items, and promotions, and can see a live dashboard (revenue, tickets sold, occupancy, most popular movie/showtime)
- Promo codes with usage limits, minimum spend, and date windows, applied at checkout and re-validated at payment time

## Stack

Next.js 15 (App Router, TypeScript), Tailwind v4, PostgreSQL via Prisma 7 (Neon), custom session-based auth (no NextAuth/Clerk — HMAC-signed cookies, bcrypt), deployed on Vercel.

No ORM shortcuts for anything that touches money or inventory — seat holds, bookings, refunds, and promo redemption all go through explicit transactions.

## The parts I'd actually talk about in an interview

Most of this app is standard CRUD, which isn't very interesting on its own. A few pieces weren't:

**Seat locking under real concurrency.** Two people can click the same seat at the same time. Seat holds/releases/confirms go through conditional updates (`UPDATE ... WHERE status = 'AVAILABLE'`) rather than read-then-write, so a losing request fails cleanly instead of silently overwriting the winner. I caught a real version of this bug by opening the app in two browser windows as two different users — the seat map was fully optimistic client-side and never called the hold action at all, so both users could "select" the same seat with no conflict. Fixed by making seat selection an async server action with proper error states instead of trusting the client.

**Promo codes can't be double-spent.** A promo with `usageLimit: 1` is validated with an atomic `updateMany` guarded by `usedCount < usageLimit`, inside the same transaction as the booking write. I tested this by firing two simultaneous bookings at a single-use code — final count came out to exactly 1, not 2.

**A layout-level auth check isn't enough.** Next.js layouts only re-run when you navigate into that route segment from outside it — clicking between sibling pages under `/admin` with `<Link>` keeps the layout mounted and does not re-check auth, only the page itself re-fetches. I found this because a stale session in one tab caused the current admin's name to show up next to the wrong row after switching accounts in a different tab. The layout gate had correctly blocked the initial entry, but a mid-session account change on client-side navigation slipped past it. Fixed by giving every admin page that queries data its own independent auth check instead of relying on the layout — and then audited every other admin/staff route to confirm which ones actually needed the same fix (most didn't, because their data-fetching happens inside server actions, which always run fresh).

**Foreign key errors don't always come back as the error code you'd expect.** Deleting a movie with an active booking should fail cleanly. It didn't — Prisma's `@prisma/adapter-pg` only maps the common Postgres FK violation code (23503) to a known Prisma error code; the `restrict_violation` code (23001) that `ON DELETE RESTRICT` actually raises falls through as a generic wrapped error instead. Fixed by reading the real Postgres error code out of the nested driver error rather than trusting Prisma's mapped code alone.

**The Vercel build broke in a way that didn't reproduce locally.** Every `@prisma/client` import failed on Vercel with "has no exported member," even though the app built fine on my machine. Root cause: `prisma generate` had only ever been run manually in the terminal, never wired into `package.json`, so Vercel's clean install never generated a client at all. Fixed with a `postinstall` script — but that surfaced a second, subtler issue: importing a Prisma enum for its runtime values (`Object.values(SomeEnum)`) inside a client component pulls Prisma's entire server-only dependency chain into the browser bundle. Swept the whole codebase for the pattern rather than just the one file the error pointed to, and split each case into either a type-only import or a plain hardcoded string array depending on whether the file actually needed runtime values.

## Database

Prisma schema models the full domain: users and roles, movies, cinemas/screens/seats, showtimes, per-showtime seat state, bookings, payments, tickets (with QR tokens), food items and orders, and promotions. Seat state is tracked per-showtime rather than globally, since the same physical seat is a different booking target for every showing.

## Running it locally

```bash
git clone <repo-url>
cd cinepass
npm install
```

Set up `.env` with:

```
DATABASE_URL=
SESSION_SECRET=
SEAT_HOLD_MINUTES=
```

Then:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

The seed script creates a handful of movies, a cinema with two screens, seats, showtimes, and a food catalog, so the app is browsable immediately without manual data entry.

## What's not built

No real payment gateway (payment is an explicitly simulated success/decline). No email notifications. No geolocation for "cinemas near you." Ticket validation and admin tooling are role-gated but there's no self-serve way to become staff/admin — that's a manual database update, which is fine for a portfolio project but wouldn't fly in production.

## Roles

New accounts are customers by default. Staff and admin roles are assigned by an existing admin from the customer management screen (or manually in the database for the first admin account).
