"use server";

import * as z from "zod";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getSession as getDbSession } from "@/lib/session";

const BCRYPT_ROUNDS = 12;

// Valid bcrypt hash of a value nobody knows — compared against on a
// nonexistent-user login so "no such account" and "wrong password" take
// the same amount of time and don't leak which emails are registered.
const DUMMY_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8/1z9C6UHwzCM/OKPnnNNfSdd3nDzu";

export type AuthFormState =
  | {
      errors?: { name?: string[]; email?: string[]; password?: string[] };
      message?: string;
    }
  | undefined;

/** Only ever follow a returnTo back into the app — never off-site. */
function safeReturnTo(formData: FormData): string | null {
  const value = formData.get("returnTo");
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

const RegisterSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters." }).trim(),
  email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase(),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
});

export async function register(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { name, email, password } = validated.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] } };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });

  await createSession(user.id);
  redirect(safeReturnTo(formData) ?? "/profile");
}

const LoginSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "Password is required." }),
});

export async function login(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { email, password } = validated.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordMatches) {
    return { message: "Incorrect email or password." };
  }

  await createSession(user.id);
  redirect(safeReturnTo(formData) ?? "/profile");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

/** Lightweight session read for client-invoked checks — see getCurrentUser() in lib/session.ts for the full user record. */
export async function getSession() {
  const session = await getDbSession();
  if (!session) return null;
  return { userId: session.userId, expiresAt: session.expiresAt };
}
