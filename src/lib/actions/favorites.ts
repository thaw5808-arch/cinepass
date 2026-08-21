"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type ToggleFavoriteResult = { ok: true; favorited: boolean } | { ok: false; error: string };

/** Toggles a FavoriteMovie row for the caller's own session — deletes it if present, creates it otherwise. Used by the heart button on movie details pages and on the profile page's favorites section. */
export async function toggleFavoriteMovieAction(movieId: string): Promise<ToggleFavoriteResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in to save favorites." };
  }

  const key = { userId_movieId: { userId: user.id, movieId } };
  const existing = await prisma.favoriteMovie.findUnique({ where: key });

  if (existing) {
    await prisma.favoriteMovie.delete({ where: key });
    return { ok: true, favorited: false };
  }

  const movie = await prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } });
  if (!movie) {
    return { ok: false, error: "Movie not found." };
  }

  await prisma.favoriteMovie.create({ data: { userId: user.id, movieId } });
  return { ok: true, favorited: true };
}

/** Toggles a FavoriteCinema row for the caller's own session — same shape as toggleFavoriteMovieAction. Used by the heart button on the cinemas list and the profile page's favorites section. */
export async function toggleFavoriteCinemaAction(cinemaId: string): Promise<ToggleFavoriteResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in to save favorites." };
  }

  const key = { userId_cinemaId: { userId: user.id, cinemaId } };
  const existing = await prisma.favoriteCinema.findUnique({ where: key });

  if (existing) {
    await prisma.favoriteCinema.delete({ where: key });
    return { ok: true, favorited: false };
  }

  const cinema = await prisma.cinema.findUnique({ where: { id: cinemaId }, select: { id: true } });
  if (!cinema) {
    return { ok: false, error: "Cinema not found." };
  }

  await prisma.favoriteCinema.create({ data: { userId: user.id, cinemaId } });
  return { ok: true, favorited: true };
}
