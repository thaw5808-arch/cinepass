import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { MovieForm, type MovieFormDefaults } from "../../movie-form";

export default async function EditMoviePage({ params }: { params: Promise<{ id: string }> }) {
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

  const movie = await prisma.movie.findUnique({ where: { id } });
  if (!movie) notFound();

  const defaultValues: MovieFormDefaults = {
    title: movie.title,
    synopsis: movie.synopsis,
    genres: movie.genres.join(", "),
    durationMins: movie.durationMins,
    rating: movie.rating,
    ageRating: movie.ageRating,
    language: movie.language,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    releaseDate: movie.releaseDate.toISOString().slice(0, 10),
    status: movie.status,
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Edit Movie</h1>
      <MovieForm mode="edit" movieId={movie.id} defaultValues={defaultValues} />
    </div>
  );
}
