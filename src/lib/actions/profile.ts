"use server";

import * as z from "zod";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// Matches actions/auth.ts's BCRYPT_ROUNDS — kept as a separate constant
// rather than importing it, since auth.ts doesn't export it.
const BCRYPT_ROUNDS = 12;

export type ProfileFormState =
  | {
      errors?: Partial<Record<"name" | "phone" | "city" | "language", string[]>>;
      message?: string;
      success?: boolean;
    }
  | undefined;

const ProfileSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters." }).trim(),
  phone: z.string().trim().optional(),
  city: z.string().trim().optional(),
  language: z.string().min(1, { error: "Choose a language." }).trim(),
});

/**
 * Self-only: there's no user id taken from the client here — the row
 * updated is always whoever getCurrentUser() resolves to from the caller's
 * own session cookie, so there's no way to target another user's profile.
 */
export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { message: "Please log in to update your profile." };
  }

  const validated = ProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    city: formData.get("city") || undefined,
    language: formData.get("language"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      phone: data.phone || null,
      city: data.city || null,
      language: data.language,
    },
  });

  return { success: true };
}

export type PasswordFormState =
  | {
      errors?: Partial<Record<"currentPassword" | "newPassword", string[]>>;
      message?: string;
      success?: boolean;
    }
  | undefined;

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, { error: "Enter your current password." }),
  newPassword: z.string().min(8, { error: "New password must be at least 8 characters." }),
});

/** Self-only, same reasoning as updateProfileAction — and the current password is verified against the caller's own hash before anything is written. */
export async function changePasswordAction(
  _prevState: PasswordFormState,
  formData: FormData
): Promise<PasswordFormState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { message: "Please log in to change your password." };
  }

  const validated = PasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { currentPassword, newPassword } = validated.data;

  // getCurrentUser() deliberately excludes passwordHash (see lib/session.ts)
  // — fetch the full row here, scoped to the caller's own id only.
  const fullUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { id: true, passwordHash: true },
  });
  if (!fullUser) {
    return { message: "Account not found." };
  }

  const currentMatches = await bcrypt.compare(currentPassword, fullUser.passwordHash);
  if (!currentMatches) {
    return { errors: { currentPassword: ["Current password is incorrect."] } };
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: fullUser.id }, data: { passwordHash } });

  return { success: true };
}
