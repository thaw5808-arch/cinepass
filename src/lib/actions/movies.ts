"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { MovieStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isForeignKeyRestrictionError } from "@/lib/prisma-errors";

export type MovieFormState =
  | {
      errors?: Partial<
        Record<
          | "title"
          | "synopsis"
          | "genres"
          | "durationMins"
          | "rating"
          | "ageRating"
          | "language"
          | "posterUrl"
          | "backdropUrl"
          | "releaseDate"
          | "status",
          string[]
        >
      >;
      message?: string;
    }
  | undefined;

const MovieFormSchema = z.object({
  title: z.string().min(1, { error: "Title is required." }).trim(),
  synopsis: z.string().min(1, { error: "Synopsis is required." }).trim(),
  genres: z.string().min(1, { error: "Add at least one genre." }).trim(),
  durationMins: z.coerce
    .number({ error: "Enter a duration." })
    .int({ error: "Duration must be a whole number." })
    .min(1, { error: "Duration must be at least 1 minute." }),
  rating: z.coerce
    .number({ error: "Enter a rating." })
    .min(0, { error: "Rating can't be negative." })
    .max(10, { error: "Rating is out of 10." }),
  ageRating: z.string().min(1, { error: "Age rating is required." }).trim(),
  language: z.string().min(1, { error: "Language is required." }).trim(),
  posterUrl: z.url({ error: "Enter a valid poster image URL." }),
  backdropUrl: z.url({ error: "Enter a valid backdrop image URL." }),
  releaseDate: z.iso.date({ error: "Enter a valid release date." }),
  status: z.enum(MovieStatus, { error: "Choose a status." }),
});

function parseMovieForm(formData: FormData) {
  return MovieFormSchema.safeParse({
    title: formData.get("title"),
    synopsis: formData.get("synopsis"),
    genres: formData.get("genres"),
    durationMins: formData.get("durationMins"),
    rating: formData.get("rating"),
    ageRating: formData.get("ageRating"),
    language: formData.get("language"),
    posterUrl: formData.get("posterUrl"),
    backdropUrl: formData.get("backdropUrl"),
    releaseDate: formData.get("releaseDate"),
    status: formData.get("status"),
  });
}

/** "Sci-Fi, Adventure" -> ["Sci-Fi", "Adventure"] — the form collects genres as one comma-separated field rather than a dynamic list widget. */
function splitGenres(raw: string) {
  return raw
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Appends -2, -3, ... on collision so two movies can share a title without a slug clash. */
async function uniqueSlug(title: string) {
  const base = slugify(title) || "movie";
  let slug = base;
  for (let suffix = 2; await prisma.movie.findUnique({ where: { slug }, select: { id: true } }); suffix++) {
    slug = `${base}-${suffix}`;
  }
  return slug;
}

/** ADMIN check — independent of any page-level gate, same pattern as updateUserRoleAction in actions/users.ts. */
async function requireAdmin(): Promise<{ ok: true } | { ok: false; state: MovieFormState }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, state: { message: "You don't have permission to manage movies." } };
  }
  return { ok: true };
}

export async function createMovieAction(
  _prevState: MovieFormState,
  formData: FormData
): Promise<MovieFormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const validated = parseMovieForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;
  const slug = await uniqueSlug(data.title);

  await prisma.movie.create({
    data: {
      slug,
      title: data.title,
      synopsis: data.synopsis,
      genres: splitGenres(data.genres),
      durationMins: data.durationMins,
      rating: data.rating,
      ageRating: data.ageRating,
      language: data.language,
      // Not yet exposed in the admin form — default rather than block
      // movie creation on fields this form doesn't collect.
      subtitles: [],
      director: "",
      cast: [],
      posterUrl: data.posterUrl,
      backdropUrl: data.backdropUrl,
      releaseDate: new Date(data.releaseDate),
      status: data.status,
    },
  });

  redirect("/admin/movies");
}

export async function updateMovieAction(
  _prevState: MovieFormState,
  formData: FormData
): Promise<MovieFormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const movieId = formData.get("movieId");
  if (typeof movieId !== "string" || !movieId) {
    return { message: "Missing movie id." };
  }

  const validated = parseMovieForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;

  const existing = await prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } });
  if (!existing) {
    return { message: "Movie not found." };
  }

  // Slug is intentionally left unchanged — it's the public /movies/[slug]
  // URL, and regenerating it on every title edit would break existing links.
  await prisma.movie.update({
    where: { id: movieId },
    data: {
      title: data.title,
      synopsis: data.synopsis,
      genres: splitGenres(data.genres),
      durationMins: data.durationMins,
      rating: data.rating,
      ageRating: data.ageRating,
      language: data.language,
      posterUrl: data.posterUrl,
      backdropUrl: data.backdropUrl,
      releaseDate: new Date(data.releaseDate),
      status: data.status,
    },
  });

  redirect("/admin/movies");
}

export type DeleteMovieResult = { ok: true } | { ok: false; error: string };

export async function deleteMovieAction(movieId: string): Promise<DeleteMovieResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in." };
  }
  if (user.role !== "ADMIN") {
    return { ok: false, error: "You don't have permission to delete movies." };
  }

  const existing = await prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } });
  if (!existing) {
    return { ok: false, error: "Movie not found." };
  }

  try {
    // Cascades to this movie's Showtimes and ShowtimeSeats per the schema's
    // onDelete: Cascade — but Booking -> Showtime has no cascade (it's
    // ON DELETE RESTRICT at the DB level, Postgres SQLSTATE 23001), so a
    // showtime with real bookings blocks the delete rather than silently
    // orphaning booking history.
    await prisma.movie.delete({ where: { id: movieId } });
  } catch (error) {
    if (isForeignKeyRestrictionError(error)) {
      return { ok: false, error: "Can't delete — this movie has showtimes or bookings on file." };
    }
    throw error;
  }

  return { ok: true };
}
