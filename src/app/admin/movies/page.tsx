"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { NOW_SHOWING, COMING_SOON } from "@/lib/mock-movies";

type MovieStatus = "NOW_SHOWING" | "COMING_SOON" | "ENDED";

const STATUS_LABEL: Record<MovieStatus, string> = {
  NOW_SHOWING: "Now Showing",
  COMING_SOON: "Coming Soon",
  ENDED: "Ended",
};

const ROWS = [
  ...NOW_SHOWING.map((m) => ({ ...m, status: "NOW_SHOWING" as MovieStatus })),
  ...COMING_SOON.map((m) => ({ ...m, status: "COMING_SOON" as MovieStatus })),
];

export default function AdminMoviesPage() {
  const [rows, setRows] = useState(ROWS);

  const remove = (slug: string) => setRows((prev) => prev.filter((m) => m.slug !== slug));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl tracking-wide">Movies</h1>
        <button className="flex items-center gap-2 rounded-md bg-marquee-gold px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 transition">
          <Plus className="h-4 w-4" />
          Add Movie
        </button>
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
            {rows.map((m) => (
              <tr key={m.slug} className="bg-bg-card">
                <td className="px-4 py-3 text-text-primary">{m.title}</td>
                <td className="px-4 py-3 text-text-muted">{m.genres.join(", ")}</td>
                <td className="px-4 py-3 text-text-muted font-mono">
                  {Math.floor(m.durationMins / 60)}h {m.durationMins % 60}m
                </td>
                <td className="px-4 py-3 text-text-muted font-mono">
                  {m.rating > 0 ? m.rating.toFixed(1) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      m.status === "NOW_SHOWING"
                        ? "bg-marquee-gold/10 text-marquee-gold"
                        : "bg-screen-glow/10 text-screen-glow"
                    }`}
                  >
                    {STATUS_LABEL[m.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      aria-label={`Edit ${m.title}`}
                      className="rounded p-1.5 text-text-muted hover:text-marquee-gold hover:bg-bg-elevated"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`Delete ${m.title}`}
                      onClick={() => remove(m.slug)}
                      className="rounded p-1.5 text-text-muted hover:text-velvet-red-bright hover:bg-bg-elevated"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
