import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ShowtimesTable } from "./showtimes-table";

export default async function AdminShowtimesPage() {
  // Independent ADMIN check — this page runs a real query on render, same
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

  const showtimes = await prisma.showtime.findMany({
    select: {
      id: true,
      startTime: true,
      format: true,
      basePrice: true,
      movie: { select: { title: true } },
      cinema: { select: { name: true } },
      screen: { select: { name: true } },
    },
    orderBy: { startTime: "desc" },
  });

  const rows = showtimes.map((s) => ({
    id: s.id,
    movieTitle: s.movie.title,
    cinemaName: s.cinema.name,
    screenName: s.screen.name,
    dateTimeLabel: format(s.startTime, "MMM d, yyyy '·' h:mm a"),
    format: s.format,
    basePrice: s.basePrice.toNumber(),
  }));

  return (
    <div className="p-6">
      <ShowtimesTable showtimes={rows} />
    </div>
  );
}
