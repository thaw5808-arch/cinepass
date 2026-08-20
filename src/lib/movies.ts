import { prisma } from "@/lib/prisma";
import { MovieStatus } from "@prisma/client";

export function getNowShowing() {
  return prisma.movie.findMany({
    where: { status: MovieStatus.NOW_SHOWING },
    orderBy: { releaseDate: "desc" },
  });
}

export function getComingSoon() {
  return prisma.movie.findMany({
    where: { status: MovieStatus.COMING_SOON },
    orderBy: { releaseDate: "asc" },
  });
}

export function getMovieBySlug(slug: string) {
  return prisma.movie.findUnique({ where: { slug } });
}

/** Upcoming showtimes for a movie, across all cinemas/screens, soonest first. */
export function getUpcomingShowtimesForMovie(movieId: string) {
  return prisma.showtime.findMany({
    where: { movieId, startTime: { gte: new Date() } },
    orderBy: { startTime: "asc" },
    include: { cinema: true, screen: true },
  });
}
