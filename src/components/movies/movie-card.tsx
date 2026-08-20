import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

// Structural rather than imported from a specific source — satisfied by
// both MockMovie and Prisma's Movie model, so callers can pass either.
export type MovieCardMovie = {
  slug: string;
  title: string;
  genres: string[];
  ageRating: string;
  rating: number;
  posterUrl: string;
};

export function MovieCard({ movie }: { movie: MovieCardMovie }) {
  return (
    <Link
      href={`/movies/${movie.slug}`}
      className="group flex-shrink-0 w-44 sm:w-52 focus-visible:outline-none"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-bg-card">
        <Image
          src={movie.posterUrl}
          alt={`${movie.title} poster`}
          fill
          sizes="(max-width: 640px) 176px, 208px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {movie.rating > 0 && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-bg/85 px-2 py-0.5 text-xs font-mono text-marquee-gold">
            <Star className="h-3 w-3 fill-marquee-gold" />
            {movie.rating.toFixed(1)}
          </span>
        )}
      </div>
      <h3 className="mt-2.5 font-medium text-sm text-text-primary line-clamp-1 group-hover:text-marquee-gold transition-colors">
        {movie.title}
      </h3>
      <p className="text-xs text-text-muted line-clamp-1">
        {movie.genres.join(" · ")} · {movie.ageRating}
      </p>
    </Link>
  );
}
