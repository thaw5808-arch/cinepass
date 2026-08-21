"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteMovieAction, toggleFavoriteCinemaAction } from "@/lib/actions/favorites";

/**
 * Heart toggle shared by movie details pages and the cinemas list — and,
 * with onRemoved, the profile page's favorites section (see
 * favorites-section.tsx). Optimistic: flips immediately, rolls back and
 * shows the server's error (e.g. "Please log in to save favorites") if the
 * action fails.
 */
export function FavoriteButton({
  kind,
  id,
  initialFavorited,
  className = "",
  onRemoved,
}: {
  kind: "movie" | "cinema";
  id: string;
  initialFavorited: boolean;
  className?: string;
  /** Called after a successful un-favorite — lets a list (e.g. the profile page) drop the item instead of just showing an outlined heart. */
  onRemoved?: () => void;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !favorited;
    setFavorited(next);
    setError(null);

    startTransition(async () => {
      const action = kind === "movie" ? toggleFavoriteMovieAction : toggleFavoriteCinemaAction;
      const result = await action(id);

      if (!result.ok) {
        setFavorited(!next); // roll back the optimistic flip
        setError(result.error);
        return;
      }
      if (!result.favorited) onRemoved?.();
    });
  };

  return (
    <span className="inline-flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={favorited}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        className={`flex items-center justify-center rounded-full border p-2.5 transition-colors disabled:opacity-60 ${
          favorited
            ? "border-velvet-red-bright bg-velvet-red-bright/10 text-velvet-red-bright"
            : "border-border text-text-muted hover:border-velvet-red-bright hover:text-velvet-red-bright"
        } ${className}`}
      >
        <Heart className={`h-4 w-4 ${favorited ? "fill-velvet-red-bright" : ""}`} />
      </button>
      {error && <span className="text-[11px] whitespace-nowrap text-velvet-red-bright">{error}</span>}
    </span>
  );
}
