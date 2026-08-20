import "server-only";

import { cache } from "react";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const secret = (() => {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set — see .env.example.");
  return value;
})();

/**
 * The cookie never carries a bare session id — it carries `${id}.${hmac}`,
 * signed with SESSION_SECRET. This doesn't make the session itself any
 * more secret (the id is still looked up in plaintext), but it stops a
 * client from forging or tampering with the cookie value: any id that
 * didn't come from `createSession` fails the signature check before we
 * ever touch the database.
 */
function sign(sessionId: string) {
  const signature = crypto.createHmac("sha256", secret).update(sessionId).digest("base64url");
  return `${sessionId}.${signature}`;
}

function unsign(signed: string): string | null {
  const separator = signed.lastIndexOf(".");
  if (separator < 0) return null;

  const sessionId = signed.slice(0, separator);
  const signature = signed.slice(separator + 1);
  const expected = crypto.createHmac("sha256", secret).update(sessionId).digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return sessionId;
}

/** Creates a Session row and sets the signed httpOnly cookie. Call from a Server Action only. */
export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await prisma.session.create({ data: { userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sign(session.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/** Deletes the current Session row (if any) and clears the cookie. Call from a Server Action only. */
export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = unsign(cookieStore.get(SESSION_COOKIE)?.value ?? "");
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
      // Already gone — logging out twice shouldn't be an error.
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Reads and verifies the session cookie against the database. Safe to call from Server Components. */
export async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const sessionId = unsign(raw);
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt < new Date()) return null;

  return session;
}

/**
 * The DAL entry point for auth: resolves the current session to a user,
 * excluding passwordHash. Memoized per-request with React's `cache` so
 * multiple components calling this during one render only hit the
 * database once. Returns null when logged out — callers decide whether
 * that means redirecting or just hiding UI.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      city: true,
      language: true,
      createdAt: true,
    },
  });
});

/** The shape getCurrentUser() resolves to — import as a type-only dependency from Client Components (e.g. Navbar's props). */
export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;
