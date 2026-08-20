"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isForeignKeyRestrictionError } from "@/lib/prisma-errors";

export type CinemaFormState =
  | {
      errors?: Partial<
        Record<"name" | "address" | "city" | "latitude" | "longitude" | "formats", string[]>
      >;
      message?: string;
    }
  | undefined;

const CinemaFormSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).trim(),
  address: z.string().min(1, { error: "Address is required." }).trim(),
  city: z.string().min(1, { error: "City is required." }).trim(),
  latitude: z.coerce
    .number({ error: "Enter a latitude." })
    .min(-90, { error: "Latitude must be between -90 and 90." })
    .max(90, { error: "Latitude must be between -90 and 90." }),
  longitude: z.coerce
    .number({ error: "Enter a longitude." })
    .min(-180, { error: "Longitude must be between -180 and 180." })
    .max(180, { error: "Longitude must be between -180 and 180." }),
  formats: z.string().min(1, { error: "Add at least one format." }).trim(),
});

function parseCinemaForm(formData: FormData) {
  return CinemaFormSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    formats: formData.get("formats"),
  });
}

/** "IMAX, VIP, Dolby Atmos" -> ["IMAX", "VIP", "Dolby Atmos"] — the form collects formats as one comma-separated field rather than a dynamic list widget. */
function splitFormats(raw: string) {
  return raw
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Appends -2, -3, ... on collision so two cinemas can share a name without a slug clash. */
async function uniqueSlug(name: string) {
  const base = slugify(name) || "cinema";
  let slug = base;
  for (let suffix = 2; await prisma.cinema.findUnique({ where: { slug }, select: { id: true } }); suffix++) {
    slug = `${base}-${suffix}`;
  }
  return slug;
}

/** ADMIN check — independent of any page-level gate, same pattern as updateUserRoleAction in actions/users.ts. */
async function requireAdmin(): Promise<{ ok: true } | { ok: false; state: CinemaFormState }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, state: { message: "You don't have permission to manage cinemas." } };
  }
  return { ok: true };
}

export async function createCinemaAction(
  _prevState: CinemaFormState,
  formData: FormData
): Promise<CinemaFormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const validated = parseCinemaForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;
  const slug = await uniqueSlug(data.name);

  await prisma.cinema.create({
    data: {
      slug,
      name: data.name,
      address: data.address,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      formats: splitFormats(data.formats),
    },
  });

  redirect("/admin/cinemas");
}

export async function updateCinemaAction(
  _prevState: CinemaFormState,
  formData: FormData
): Promise<CinemaFormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const cinemaId = formData.get("cinemaId");
  if (typeof cinemaId !== "string" || !cinemaId) {
    return { message: "Missing cinema id." };
  }

  const validated = parseCinemaForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;

  const existing = await prisma.cinema.findUnique({ where: { id: cinemaId }, select: { id: true } });
  if (!existing) {
    return { message: "Cinema not found." };
  }

  // Slug is intentionally left unchanged — it's part of any public URL
  // built from it, and regenerating it on every name edit would break links.
  await prisma.cinema.update({
    where: { id: cinemaId },
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      formats: splitFormats(data.formats),
    },
  });

  redirect("/admin/cinemas");
}

export type DeleteCinemaResult = { ok: true } | { ok: false; error: string };

export async function deleteCinemaAction(cinemaId: string): Promise<DeleteCinemaResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in." };
  }
  if (user.role !== "ADMIN") {
    return { ok: false, error: "You don't have permission to delete cinemas." };
  }

  const existing = await prisma.cinema.findUnique({ where: { id: cinemaId }, select: { id: true } });
  if (!existing) {
    return { ok: false, error: "Cinema not found." };
  }

  // Proactive guard: Cinema -> Screen is onDelete: Cascade in the schema,
  // so prisma.cinema.delete() would otherwise silently wipe out every
  // screen (and, transitively, their showtimes) with no confirmation of
  // that blast radius. Require screens to be removed first instead.
  const screenCount = await prisma.screen.count({ where: { cinemaId } });
  if (screenCount > 0) {
    return {
      ok: false,
      error: `Can't delete — this cinema still has ${screenCount} screen${screenCount === 1 ? "" : "s"}. Remove them first.`,
    };
  }

  try {
    // Defense-in-depth against the count-check above being stale by the
    // time this runs (e.g. a screen added concurrently) — same
    // isForeignKeyRestrictionError fallback as deleteMovieAction.
    await prisma.cinema.delete({ where: { id: cinemaId } });
  } catch (error) {
    if (isForeignKeyRestrictionError(error)) {
      return { ok: false, error: "Can't delete — this cinema still has screens or showtimes on file." };
    }
    throw error;
  }

  return { ok: true };
}
