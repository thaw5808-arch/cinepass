"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { MovieStatus } from "@prisma/client";
import { deleteMovieAction } from "@/lib/actions/movies";

export type MovieRow = {
  id: string;
  title: string;
  genres: string[];
  durationMins: number;
  rating: number;
  status: MovieStatus;
};

const STATUS_LABEL: Record<MovieStatus, string> = {
  NOW_SHOWING: "Now Showing",
  COMING_SOON: "Coming Soon",
  ENDED: "Ended",
};

const STATUS_CLASS: Record<MovieStatus, string> = {
  NOW_SHOWING: "bg-marquee-gold/10 text-marquee-gold",
  COMING_SOON: "bg-screen-glow/10 text-screen-glow",
  ENDED: "bg-bg-card text-text-muted",
};

export function MoviesTable({ movies }: { movies: MovieRow[] }) {
  const [rows, setRows] = useState(movies);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string | undefined>>({});

  const remove = async (id: string) => {
    setPendingId(id);
    setErrorById((prev) => ({ ...prev, [id]: undefined }));

    const result = await deleteMovieAction(id);
    setPendingId(null);
    setConfirmingId(null);

    if (!result.ok) {
      setErrorById((prev) => ({ ...prev, [id]: result.error }));
      return;
    }
    setRows((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl tracking-wide">Movies</h1>
        <Link
          href="/admin/movies/new"
          className="flex items-center gap-2 rounded-md bg-marquee-gold px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4" />
          Add Movie
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated text-text-muted text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Genre</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  No movies yet.
                </td>
              </tr>
            ) : (
              rows.map((m) => (
                <tr key={m.id} className="bg-bg-card">
                  <td className="px-4 py-3 text-text-primary">{m.title}</td>
                  <td className="px-4 py-3 text-text-muted">{m.genres.join(", ")}</td>
                  <td className="px-4 py-3 text-text-muted font-mono">
                    {Math.floor(m.durationMins / 60)}h {m.durationMins % 60}m
                  </td>
                  <td className="px-4 py-3 text-text-muted font-mono">
                    {m.rating > 0 ? m.rating.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${STATUS_CLASS[m.status]}`}>
                      {STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {errorById[m.id] && (
                        <span className="text-xs text-velvet-red-bright">{errorById[m.id]}</span>
                      )}
                      {confirmingId === m.id ? (
                        <span className="flex items-center gap-2 text-xs">
                          <span className="text-text-muted">Delete permanently?</span>
                          <button
                            onClick={() => remove(m.id)}
                            disabled={pendingId === m.id}
                            className="rounded-md bg-velvet-red-bright px-2.5 py-1 font-semibold text-text-primary disabled:opacity-60"
                          >
                            {pendingId === m.id ? "Deleting…" : "Confirm"}
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
                            href={`/admin/movies/${m.id}/edit`}
                            aria-label={`Edit ${m.title}`}
                            className="rounded p-1.5 text-text-muted hover:text-marquee-gold hover:bg-bg-elevated"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            aria-label={`Delete ${m.title}`}
                            onClick={() => setConfirmingId(m.id)}
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
