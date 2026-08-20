"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { Prisma, ScreenType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isForeignKeyRestrictionError } from "@/lib/prisma-errors";

export type ScreenFormState =
  | {
      errors?: Partial<Record<"cinemaId" | "name" | "type" | "capacity", string[]>>;
      message?: string;
    }
  | undefined;

const ScreenFormSchema = z.object({
  cinemaId: z.string().min(1, { error: "Choose a cinema." }),
  name: z.string().min(1, { error: "Name is required." }).trim(),
  type: z.enum(ScreenType, { error: "Choose a screen type." }),
  capacity: z.coerce
    .number({ error: "Enter a capacity." })
    .int({ error: "Capacity must be a whole number." })
    .min(1, { error: "Capacity must be at least 1." }),
});

function parseScreenForm(formData: FormData) {
  return ScreenFormSchema.safeParse({
    cinemaId: formData.get("cinemaId"),
    name: formData.get("name"),
    type: formData.get("type"),
    capacity: formData.get("capacity"),
  });
}

/** ADMIN check — independent of any page-level gate, same pattern as updateUserRoleAction in actions/users.ts. */
async function requireAdmin(): Promise<{ ok: true } | { ok: false; state: ScreenFormState }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, state: { message: "You don't have permission to manage screens." } };
  }
  return { ok: true };
}

/** True for the @@unique([cinemaId, name]) constraint on Screen. */
function isDuplicateScreenNameError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (error.meta?.target as string[] | undefined)?.includes("cinemaId") === true
  );
}

export async function createScreenAction(
  _prevState: ScreenFormState,
  formData: FormData
): Promise<ScreenFormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const validated = parseScreenForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;

  const cinema = await prisma.cinema.findUnique({ where: { id: data.cinemaId }, select: { id: true } });
  if (!cinema) {
    return { errors: { cinemaId: ["Choose a valid cinema."] } };
  }

  try {
    await prisma.screen.create({
      data: {
        cinemaId: data.cinemaId,
        name: data.name,
        type: data.type,
        capacity: data.capacity,
      },
    });
  } catch (error) {
    if (isDuplicateScreenNameError(error)) {
      return { errors: { name: [`This cinema already has a screen named "${data.name}".`] } };
    }
    throw error;
  }

  redirect("/admin/screens");
}

export async function updateScreenAction(
  _prevState: ScreenFormState,
  formData: FormData
): Promise<ScreenFormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const screenId = formData.get("screenId");
  if (typeof screenId !== "string" || !screenId) {
    return { message: "Missing screen id." };
  }

  const validated = parseScreenForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;

  const existing = await prisma.screen.findUnique({ where: { id: screenId }, select: { id: true } });
  if (!existing) {
    return { message: "Screen not found." };
  }

  const cinema = await prisma.cinema.findUnique({ where: { id: data.cinemaId }, select: { id: true } });
  if (!cinema) {
    return { errors: { cinemaId: ["Choose a valid cinema."] } };
  }

  try {
    await prisma.screen.update({
      where: { id: screenId },
      data: {
        cinemaId: data.cinemaId,
        name: data.name,
        type: data.type,
        capacity: data.capacity,
      },
    });
  } catch (error) {
    if (isDuplicateScreenNameError(error)) {
      return { errors: { name: [`This cinema already has a screen named "${data.name}".`] } };
    }
    throw error;
  }

  redirect("/admin/screens");
}

export type DeleteScreenResult = { ok: true } | { ok: false; error: string };

export async function deleteScreenAction(screenId: string): Promise<DeleteScreenResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in." };
  }
  if (user.role !== "ADMIN") {
    return { ok: false, error: "You don't have permission to delete screens." };
  }

  const existing = await prisma.screen.findUnique({ where: { id: screenId }, select: { id: true } });
  if (!existing) {
    return { ok: false, error: "Screen not found." };
  }

  // Proactive guard: Screen -> Showtime is onDelete: Cascade in the schema,
  // so prisma.screen.delete() would otherwise silently wipe out every
  // showtime scheduled on it with no confirmation of that blast radius.
  // Require showtimes to be removed first instead.
  const showtimeCount = await prisma.showtime.count({ where: { screenId } });
  if (showtimeCount > 0) {
    return {
      ok: false,
      error: `Can't delete — this screen still has ${showtimeCount} showtime${showtimeCount === 1 ? "" : "s"}. Remove them first.`,
    };
  }

  try {
    // Defense-in-depth against the count-check above being stale by the
    // time this runs (e.g. a showtime added concurrently) — same
    // isForeignKeyRestrictionError fallback as deleteMovieAction. A
    // showtime with real bookings would hit Booking -> Showtime's
    // ON DELETE RESTRICT here rather than being silently cascaded away.
    await prisma.screen.delete({ where: { id: screenId } });
  } catch (error) {
    if (isForeignKeyRestrictionError(error)) {
      return { ok: false, error: "Can't delete — this screen still has showtimes or bookings on file." };
    }
    throw error;
  }

  return { ok: true };
}
