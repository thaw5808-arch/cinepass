"use server";

import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type UpdateUserRoleResult = { ok: true } | { ok: false; error: string };

/**
 * Changes a user's role. Restricted to admins — checked here independently
 * of any page-level gate (defense-in-depth, same as validateTicketAction
 * in actions/tickets.ts), since this is what actually stops a non-admin
 * from calling the action directly.
 *
 * An admin can't demote their own account: nothing else in this app can
 * grant the ADMIN role, so an admin accidentally dropping themselves to
 * CUSTOMER/STAFF would have no way back in.
 *
 * The `userId === user.id` self-check below is safe even though the
 * "You" badge on the customers page can lag reality across client-side
 * navigations (see the comment in app/admin/customers/page.tsx) — this
 * action is a fresh server request every time it's called, so `user` here
 * is always resolved from *this* invocation's actual session cookie, never
 * from anything the client rendered earlier. It can't be fooled by a
 * stale header or a stale "You" badge into comparing against the wrong id.
 */
export async function updateUserRoleAction(userId: string, newRole: Role): Promise<UpdateUserRoleResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in." };
  }
  if (user.role !== "ADMIN") {
    return { ok: false, error: "You don't have permission to change user roles." };
  }
  if (!Object.values(Role).includes(newRole)) {
    return { ok: false, error: "Invalid role." };
  }
  if (userId === user.id && newRole !== "ADMIN") {
    return { ok: false, error: "You can't change your own role — ask another admin instead." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) {
    return { ok: false, error: "User not found." };
  }

  await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
  return { ok: true };
}
