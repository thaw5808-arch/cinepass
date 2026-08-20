import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ShowtimeForm, type ShowtimeFormDefaults } from "../../showtime-form";

export default async function EditShowtimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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

  const showtime = await prisma.showtime.findUnique({
    where: { id },
    include: { movie: { select: { title: true } }, cinema: { select: { name: true } }, screen: { select: { name: true } } },
  });
  if (!showtime) notFound();

  const defaultValues: ShowtimeFormDefaults = {
    format: showtime.format,
    language: showtime.language,
    subtitle: showtime.subtitle ?? "",
    basePrice: showtime.basePrice.toNumber(),
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Edit Showtime</h1>
      <ShowtimeForm
        mode="edit"
        showtimeId={showtime.id}
        context={{
          movieTitle: showtime.movie.title,
          cinemaName: showtime.cinema.name,
          screenName: showtime.screen.name,
          dateTimeLabel: format(showtime.startTime, "MMM d, yyyy '·' h:mm a"),
        }}
        defaultValues={defaultValues}
      />
    </div>
  );
}
