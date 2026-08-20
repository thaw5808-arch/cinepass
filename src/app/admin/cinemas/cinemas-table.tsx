"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { deleteCinemaAction } from "@/lib/actions/cinemas";

export type CinemaRow = {
  id: string;
  name: string;
  city: string;
  address: string;
  formats: string[];
};

export function CinemasTable({ cinemas }: { cinemas: CinemaRow[] }) {
  const [rows, setRows] = useState(cinemas);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string | undefined>>({});

  const remove = async (id: string) => {
    setPendingId(id);
    setErrorById((prev) => ({ ...prev, [id]: undefined }));

    const result = await deleteCinemaAction(id);
    setPendingId(null);
    setConfirmingId(null);

    if (!result.ok) {
      setErrorById((prev) => ({ ...prev, [id]: result.error }));
      return;
    }
    setRows((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl tracking-wide">Cinemas</h1>
        <Link
          href="/admin/cinemas/new"
          className="flex items-center gap-2 rounded-md bg-marquee-gold px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4" />
          Add Cinema
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated text-text-muted text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium">Formats</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  No cinemas yet.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="bg-bg-card">
                  <td className="px-4 py-3 text-text-primary">{c.name}</td>
                  <td className="px-4 py-3 text-text-muted">{c.city}</td>
                  <td className="px-4 py-3 text-text-muted">{c.address}</td>
                  <td className="px-4 py-3 text-text-muted">{c.formats.join(", ") || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {errorById[c.id] && (
                        <span className="text-xs text-velvet-red-bright">{errorById[c.id]}</span>
                      )}
                      {confirmingId === c.id ? (
                        <span className="flex items-center gap-2 text-xs">
                          <span className="text-text-muted">Delete permanently?</span>
                          <button
                            onClick={() => remove(c.id)}
                            disabled={pendingId === c.id}
                            className="rounded-md bg-velvet-red-bright px-2.5 py-1 font-semibold text-text-primary disabled:opacity-60"
                          >
                            {pendingId === c.id ? "Deleting…" : "Confirm"}
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            aria-label="Cancel delete"
                            className="text-text-muted hover:text-text-primary"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ) : (
                        <>
                          <Link
                            href={`/admin/cinemas/${c.id}/edit`}
                            aria-label={`Edit ${c.name}`}
                            className="rounded p-1.5 text-text-muted hover:text-marquee-gold hover:bg-bg-elevated"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            aria-label={`Delete ${c.name}`}
                            onClick={() => setConfirmingId(c.id)}
                            className="rounded p-1.5 text-text-muted hover:text-velvet-red-bright hover:bg-bg-elevated"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
