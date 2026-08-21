import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/** [start of today, start of tomorrow) in the server's local time — every "today" query below shares these same bounds. */
function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export default async function AdminDashboardPage() {
  // Independent ADMIN check — this page runs real queries on render, same
  // reasoning as admin/customers/page.tsx: a parent layout skipping
  // {children} on a stale client-side transition doesn't stop this page's
  // own data fetch from running, so the check has to live here too.
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="p-6">
        <p className="text-sm text-text-muted">
          The admin dashboard is restricted to administrators.
        </p>
      </div>
    );
  }

  const { start: todayStart, end: todayEnd } = todayBounds();
  const createdToday = { gte: todayStart, lt: todayEnd };

  const [
    revenueAgg,
    ticketsSoldToday,
    bookingsToday,
    totalSeatsToday,
    bookedSeatsToday,
    confirmedBookings,
  ] = await Promise.all([
    prisma.booking.aggregate({
      where: { status: "CONFIRMED", createdAt: createdToday },
      _sum: { total: true },
    }),
    prisma.bookingSeat.count({
      where: { booking: { status: "CONFIRMED", createdAt: createdToday } },
    }),
    prisma.booking.count({ where: { status: "CONFIRMED", createdAt: createdToday } }),
    prisma.showtimeSeat.count({ where: { showtime: { startTime: { gte: todayStart, lt: todayEnd } } } }),
    prisma.showtimeSeat.count({
      where: { showtime: { startTime: { gte: todayStart, lt: todayEnd } }, status: "BOOKED" },
    }),
    // Feeds both Popular Movie and Popular Showtime below — one query,
    // aggregated in JS. All-time (not just today) per the brief, since
    // there's little enough real data that "today" alone would be too
    // sparse to be a meaningful "popular" anything.
    prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      select: { showtime: { select: { startTime: true, movie: { select: { id: true, title: true } } } } },
    }),
  ]);

  const todaysRevenue = revenueAgg._sum.total?.toNumber() ?? 0;
  const occupancy = totalSeatsToday > 0 ? (bookedSeatsToday / totalSeatsToday) * 100 : null;

  const movieCounts = new Map<string, { title: string; count: number }>();
  const timeOfDayCounts = new Map<string, number>();
  for (const b of confirmedBookings) {
    const movie = b.showtime.movie;
    const movieEntry = movieCounts.get(movie.id) ?? { title: movie.title, count: 0 };
    movieEntry.count += 1;
    movieCounts.set(movie.id, movieEntry);

    // Grouped straight into its display format ("7:30 PM") — showtimes run
    // at a handful of fixed daily slots, so times land in the same bucket
    // without needing a separate parse-then-reformat pass.
    const timeLabel = format(b.showtime.startTime, "h:mm a");
    timeOfDayCounts.set(timeLabel, (timeOfDayCounts.get(timeLabel) ?? 0) + 1);
  }
  const popularMovie = [...movieCounts.values()].sort((a, b) => b.count - a.count)[0] ?? null;
  const popularShowtime = [...timeOfDayCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  const stats: { label: string; value: string; sublabel: string }[] = [
    { label: "Today's Revenue", value: `฿${todaysRevenue.toFixed(0)}`, sublabel: `${bookingsToday} booking${bookingsToday === 1 ? "" : "s"} today` },
    { label: "Tickets Sold", value: String(ticketsSoldToday), sublabel: "seats booked today" },
    {
      label: "Occupancy",
      value: occupancy === null ? "—" : `${occupancy.toFixed(0)}%`,
      sublabel: totalSeatsToday === 0 ? "No showtimes today" : `${bookedSeatsToday} of ${totalSeatsToday} seats`,
    },
    { label: "Bookings", value: String(bookingsToday), sublabel: "confirmed today" },
    {
      label: "Popular Movie",
      value: popularMovie?.title ?? "—",
      sublabel: popularMovie ? `${popularMovie.count} booking${popularMovie.count === 1 ? "" : "s"}` : "No confirmed bookings yet",
    },
    {
      label: "Popular Showtime",
      value: popularShowtime?.[0] ?? "—",
      sublabel: popularShowtime ? `${popularShowtime[1]} booking${popularShowtime[1] === 1 ? "" : "s"}` : "No confirmed bookings yet",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-bg-elevated p-5">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className="font-display text-3xl text-marquee-gold mt-1 truncate" title={s.value}>
              {s.value}
            </p>
            <p className="text-xs text-text-muted mt-1">{s.sublabel}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-text-muted">
        Charts for revenue, ticket sales, and occupancy plug in here once there&apos;s enough booking data to chart.
      </p>
    </div>
  );
}
