"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { deleteShowtimeAction } from "@/lib/actions/showtimes";

export type ShowtimeRow = {
  id: string;
  movieTitle: string;
  cinemaName: string;
  screenName: string;
  dateTimeLabel: string;
  format: string;
  basePrice: number;
};

export function ShowtimesTable({ showtimes }: { showtimes: ShowtimeRow[] }) {
  const [rows, setRows] = useState(showtimes);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string | undefined>>({});

  const remove = async (id: string) => {
    setPendingId(id);
    setErrorById((prev) => ({ ...prev, [id]: undefined }));

    const result = await deleteShowtimeAction(id);
    setPendingId(null);
    setConfirmingId(null);

    if (!result.ok) {
      setErrorById((prev) => ({ ...prev, [id]: result.error }));
      return;
    }
    setRows((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl tracking-wide">Showtimes</h1>
        <Link
          href="/admin/showtimes/new"
          className="flex items-center gap-2 rounded-md bg-marquee-gold px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4" />
          Add Showtime
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated text-text-muted text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Movie</th>
              <th className="px-4 py-3 font-medium">Cinema</th>
              <th className="px-4 py-3 font-medium">Screen</th>
              <th className="px-4 py-3 font-medium">Date &amp; Time</th>
              <th className="px-4 py-3 font-medium">Format</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  No showtimes yet.
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id} className="bg-bg-card">
                  <td className="px-4 py-3 text-text-primary">{s.movieTitle}</td>
                  <td className="px-4 py-3 text-text-muted">{s.cinemaName}</td>
                  <td className="px-4 py-3 text-text-muted">{s.screenName}</td>
                  <td className="px-4 py-3 text-text-muted font-mono">{s.dateTimeLabel}</td>
                  <td className="px-4 py-3 text-text-muted">{s.format}</td>
                  <td className="px-4 py-3 text-text-muted font-mono">฿{s.basePrice.toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {errorById[s.id] && (
                        <span className="text-xs text-velvet-red-bright">{errorById[s.id]}</span>
                      )}
                      {confirmingId === s.id ? (
                        <span className="flex items-center gap-2 text-xs">
                          <span className="text-text-muted">Delete permanently?</span>
                          <button
                            onClick={() => remove(s.id)}
                            disabled={pendingId === s.id}
                            className="rounded-md bg-velvet-red-bright px-2.5 py-1 font-semibold text-text-primary disabled:opacity-60"
                          >
                            {pendingId === s.id ? "Deleting…" : "Confirm"}
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
                            href={`/admin/showtimes/${s.id}/edit`}
                            aria-label={`Edit ${s.movieTitle} showtime`}
                            className="rounded p-1.5 text-text-muted hover:text-marquee-gold hover:bg-bg-elevated"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            aria-label={`Delete ${s.movieTitle} showtime`}
                            onClick={() => setConfirmingId(s.id)}
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
