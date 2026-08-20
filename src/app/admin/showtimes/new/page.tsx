import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ShowtimeForm } from "../showtime-form";

export default async function NewShowtimePage() {
  // Independent ADMIN check — unlike admin/movies/new, this page DOES run
  // real queries (the movie/cinema/screen lists for the dropdowns below),
  // so it needs the same check as admin/customers/page.tsx rather than
  // relying solely on the layout's gate.
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

  const [movies, cinemas, screens] = await Promise.all([
    prisma.movie.findMany({ select: { id: true, title: true, durationMins: true }, orderBy: { title: "asc" } }),
    prisma.cinema.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.screen.findMany({ select: { id: true, name: true, cinemaId: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Add Showtime</h1>
      <ShowtimeForm mode="create" movies={movies} cinemas={cinemas} screens={screens} />
    </div>
  );
}
