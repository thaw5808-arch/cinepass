"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { updateUserRoleAction } from "@/lib/actions/users";

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  joined: string;
};

const ROLE_OPTIONS: Role[] = [Role.CUSTOMER, Role.STAFF, Role.ADMIN];

type RowStatus = { kind: "success" | "error"; message: string };

export function CustomersTable({
  users,
  currentUserId,
}: {
  users: CustomerRow[];
  currentUserId: string;
}) {
  const [rows, setRows] = useState(users);
  const [statusByUser, setStatusByUser] = useState<Record<string, RowStatus | undefined>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleChange = async (userId: string, newRole: Role) => {
    const previousRole = rows.find((r) => r.id === userId)?.role;

    setPendingId(userId);
    setStatusByUser((prev) => ({ ...prev, [userId]: undefined }));
    setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role: newRole } : r)));

    const result = await updateUserRoleAction(userId, newRole);
    setPendingId(null);

    if (!result.ok) {
      setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role: previousRole ?? r.role } : r)));
      setStatusByUser((prev) => ({ ...prev, [userId]: { kind: "error", message: result.error } }));
      return;
    }

    setStatusByUser((prev) => ({ ...prev, [userId]: { kind: "success", message: "Updated" } }));
    setTimeout(() => {
      setStatusByUser((prev) => ({ ...prev, [userId]: undefined }));
    }, 2500);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-bg-elevated text-text-muted text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium">Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((u) => {
            const isSelf = u.id === currentUserId;
            const status = statusByUser[u.id];
            return (
              <tr key={u.id} className="bg-bg-card">
                <td className="px-4 py-3 text-text-primary">
                  {u.name}
                  {isSelf && (
                    <span className="ml-2 rounded-full bg-marquee-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-marquee-gold">
                      You
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-muted">{u.email}</td>
                <td className="px-4 py-3 text-text-muted font-mono">{u.joined}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      disabled={isSelf || pendingId === u.id}
                      aria-label={`Role for ${u.name}`}
                      title={isSelf ? "You can't change your own role" : undefined}
                      onChange={(e) => handleChange(u.id, e.target.value as Role)}
                      className="rounded-md border border-border bg-bg px-2 py-1.5 text-xs text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {status && (
                      <span
                        className={`text-xs ${
                          status.kind === "success" ? "text-marquee-gold" : "text-velvet-red-bright"
                        }`}
                      >
                        {status.message}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
