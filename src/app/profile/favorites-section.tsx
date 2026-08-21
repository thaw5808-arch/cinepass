"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FavoriteButton } from "@/components/favorite-button";

export type FavoriteMovieItem = {
  movieId: string;
  slug: string;
  title: string;
  posterUrl: string;
};

export function FavoriteMoviesSection({ movies }: { movies: FavoriteMovieItem[] }) {
  const [items, setItems] = useState(movies);

  if (items.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No favorite movies yet — tap the heart on a movie&apos;s page to save it here.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
      {items.map((m) => (
        <div key={m.movieId} className="relative">
          <Link href={`/movies/${m.slug}`} className="block group">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-bg-card">
              <Image
                src={m.posterUrl}
                alt={`${m.title} poster`}
                fill
                sizes="(max-width: 640px) 45vw, 180px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p className="mt-2 text-sm text-text-primary line-clamp-1">{m.title}</p>
          </Link>
          <FavoriteButton
            kind="movie"
            id={m.movieId}
            initialFavorited
            className="absolute top-2 right-2 !p-2 bg-bg/85"
            onRemoved={() => setItems((prev) => prev.filter((x) => x.movieId !== m.movieId))}
          />
        </div>
      ))}
    </div>
  );
}

export type FavoriteCinemaItem = {
  cinemaId: string;
  name: string;
  address: string;
  city: string;
};

export function FavoriteCinemasSection({ cinemas }: { cinemas: FavoriteCinemaItem[] }) {
  const [items, setItems] = useState(cinemas);

  if (items.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No favorite cinemas yet — tap the heart on a cinema to save it here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((c) => (
        <div
          key={c.cinemaId}
          className="flex items-center justify-between gap-4 rounded-lg border border-border bg-bg-elevated p-4"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">{c.name}</p>
            <p className="text-xs text-text-muted line-clamp-1">
              {c.address}, {c.city}
            </p>
          </div>
          <FavoriteButton
            kind="cinema"
            id={c.cinemaId}
            initialFavorited
            className="shrink-0 !p-2"
            onRemoved={() => setItems((prev) => prev.filter((x) => x.cinemaId !== c.cinemaId))}
          />
        </div>
      ))}
    </div>
  );
}
