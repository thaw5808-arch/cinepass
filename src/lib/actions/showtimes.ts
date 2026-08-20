"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { SeatCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isForeignKeyRestrictionError } from "@/lib/prisma-errors";
import { seatPriceFor } from "@/lib/pricing";
import { hasOverlappingShowtime } from "@/lib/showtimes";

export type ShowtimeFormState =
  | {
      errors?: Partial<
        Record<
          "movieId" | "cinemaId" | "screenId" | "startTime" | "format" | "language" | "subtitle" | "basePrice",
          string[]
        >
      >;
      message?: string;
    }
  | undefined;

const CreateShowtimeSchema = z.object({
  movieId: z.string().min(1, { error: "Choose a movie." }),
  cinemaId: z.string().min(1, { error: "Choose a cinema." }),
  screenId: z.string().min(1, { error: "Choose a screen." }),
  startTime: z.string().min(1, { error: "Pick a date and time." }),
  format: z.string().min(1, { error: "Format is required." }).trim(),
  language: z.string().min(1, { error: "Language is required." }).trim(),
  subtitle: z.string().trim().optional(),
  basePrice: z.coerce
    .number({ error: "Enter a base price." })
    .positive({ error: "Base price must be greater than 0." }),
});

const UpdateShowtimeSchema = z.object({
  format: z.string().min(1, { error: "Format is required." }).trim(),
  language: z.string().min(1, { error: "Language is required." }).trim(),
  subtitle: z.string().trim().optional(),
  basePrice: z.coerce
    .number({ error: "Enter a base price." })
    .positive({ error: "Base price must be greater than 0." }),
});

function parseCreateForm(formData: FormData) {
  return CreateShowtimeSchema.safeParse({
    movieId: formData.get("movieId"),
    cinemaId: formData.get("cinemaId"),
    screenId: formData.get("screenId"),
    startTime: formData.get("startTime"),
    format: formData.get("format"),
    language: formData.get("language"),
    subtitle: formData.get("subtitle") || undefined,
    basePrice: formData.get("basePrice"),
  });
}

function parseUpdateForm(formData: FormData) {
  return UpdateShowtimeSchema.safeParse({
    format: formData.get("format"),
    language: formData.get("language"),
    subtitle: formData.get("subtitle") || undefined,
    basePrice: formData.get("basePrice"),
  });
}

/** ADMIN check — independent of any page-level gate, same pattern as updateUserRoleAction in actions/users.ts. */
async function requireAdmin(): Promise<{ ok: true } | { ok: false; state: ShowtimeFormState }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, state: { message: "You don't have permission to manage showtimes." } };
  }
  return { ok: true };
}

export async function createShowtimeAction(
  _prevState: ShowtimeFormState,
  formData: FormData
): Promise<ShowtimeFormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const validated = parseCreateForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;

  const startTime = new Date(data.startTime);
  if (Number.isNaN(startTime.getTime())) {
    return { errors: { startTime: ["Enter a valid date and time."] } };
  }

  const movie = await prisma.movie.findUnique({
    where: { id: data.movieId },
    select: { durationMins: true },
  });
  if (!movie) {
    return { errors: { movieId: ["Choose a valid movie."] } };
  }

  const cinema = await prisma.cinema.findUnique({ where: { id: data.cinemaId }, select: { id: true } });
  if (!cinema) {
    return { errors: { cinemaId: ["Choose a valid cinema."] } };
  }

  const screen = await prisma.screen.findUnique({
    where: { id: data.screenId },
    select: { id: true, cinemaId: true },
  });
  if (!screen || screen.cinemaId !== data.cinemaId) {
    return { errors: { screenId: ["Choose a screen that belongs to the selected cinema."] } };
  }

  // endTime is derived, never trusted from the client — the movie's real
  // durationMins is the only thing that decides how long the screen is held.
  const endTime = new Date(startTime.getTime() + movie.durationMins * 60 * 1000);

  // Application-level overlap guard — see the comment on Showtime in
  // prisma/schema.prisma and src/lib/showtimes.ts; Postgres can't express
  // this constraint directly.
  if (await hasOverlappingShowtime(data.screenId, startTime, endTime)) {
    return {
      errors: { startTime: ["This screen already has a showtime that overlaps this time range."] },
    };
  }

  // Seats for a brand-new screen may not exist yet (seat layout management
  // is a separate, later pass) — that's fine, this just creates zero
  // ShowtimeSeat rows rather than failing.
  const seats = await prisma.seat.findMany({
    where: { screenId: data.screenId },
    select: { id: true, category: true },
  });

  await prisma.showtime.create({
    data: {
      movieId: data.movieId,
      cinemaId: data.cinemaId,
      screenId: data.screenId,
      startTime,
      endTime,
      format: data.format,
      language: data.language,
      subtitle: data.subtitle ?? null,
      basePrice: data.basePrice,
      // Nested create wraps this in one transaction with the Showtime
      // insert, so a partial seat-generation failure can't leave a
      // showtime with no inventory behind.
      showtimeSeats: {
        create: seats.map((seat) => ({
          seatId: seat.id,
          price: seatPriceFor(seat.category, data.basePrice),
        })),
      },
    },
  });

  redirect("/admin/showtimes");
}

export async function updateShowtimeAction(
  _prevState: ShowtimeFormState,
  formData: FormData
): Promise<ShowtimeFormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const showtimeId = formData.get("showtimeId");
  if (typeof showtimeId !== "string" || !showtimeId) {
    return { message: "Missing showtime id." };
  }

  const validated = parseUpdateForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;

  const existing = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    select: { id: true, basePrice: true },
  });
  if (!existing) {
    return { message: "Showtime not found." };
  }

  const repriceSeats = existing.basePrice.toNumber() !== data.basePrice;

  // Movie/cinema/screen/time are intentionally not editable here — changing
  // any of them would mean regenerating seat inventory, which this form
  // doesn't do; delete and recreate the showtime instead.
  await prisma.$transaction(async (tx) => {
    await tx.showtime.update({
      where: { id: showtimeId },
      data: {
        format: data.format,
        language: data.language,
        subtitle: data.subtitle ?? null,
        basePrice: data.basePrice,
      },
    });

    if (!repriceSeats) return;

    // ShowtimeSeat.price is what checkout actually charges (see
    // src/lib/seat-locking.ts / booking-context.tsx) — Showtime.basePrice
    // is just the reference value it's derived from. Without repricing
    // here, editing the base price would have no visible effect on what
    // customers are charged.
    //
    // One updateMany per SeatCategory (at most 5 queries) rather than one
    // update() per seat — a full-size screen has 100+ seats, and looping
    // individual updates inside this interactive transaction was slow
    // enough over a real DB connection to blow past Prisma's 5s default
    // transaction timeout (hit P2028 in testing). Every seat in a category
    // reprices to the same value, so this is both faster and simpler.
    for (const category of Object.values(SeatCategory)) {
      await tx.showtimeSeat.updateMany({
        where: { showtimeId, seat: { category } },
        data: { price: seatPriceFor(category, data.basePrice) },
      });
    }
  });

  redirect("/admin/showtimes");
}

export type DeleteShowtimeResult = { ok: true } | { ok: false; error: string };

export async function deleteShowtimeAction(showtimeId: string): Promise<DeleteShowtimeResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in." };
  }
  if (user.role !== "ADMIN") {
    return { ok: false, error: "You don't have permission to delete showtimes." };
  }

  const existing = await prisma.showtime.findUnique({ where: { id: showtimeId }, select: { id: true } });
  if (!existing) {
    return { ok: false, error: "Showtime not found." };
  }

  // Proactive guard: Showtime -> ShowtimeSeat is onDelete: Cascade in the
  // schema, so prisma.showtime.delete() would otherwise try to cascade
  // through real bookings. Block up front with an accurate count rather
  // than surfacing a raw constraint failure.
  const bookingCount = await prisma.booking.count({ where: { showtimeId } });
  if (bookingCount > 0) {
    return {
      ok: false,
      error: `Can't delete — this showtime has ${bookingCount} booking${bookingCount === 1 ? "" : "s"} on file.`,
    };
  }

  try {
    // Defense-in-depth against the count-check above being stale by the
    // time this runs (e.g. a booking placed concurrently) — same
    // isForeignKeyRestrictionError fallback as deleteMovieAction. Either
    // Booking -> Showtime or BookingSeat -> ShowtimeSeat's RESTRICT can
    // fire here; both classify the same way.
    await prisma.showtime.delete({ where: { id: showtimeId } });
  } catch (error) {
    if (isForeignKeyRestrictionError(error)) {
      return { ok: false, error: "Can't delete — this showtime has bookings on file." };
    }
    throw error;
  }

  return { ok: true };
}
