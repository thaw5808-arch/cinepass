import { MovieCard } from "@/components/movies/movie-card";
import { NOW_SHOWING, COMING_SOON } from "@/lib/mock-movies";

export default function MoviesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl tracking-wide mb-8">Movies</h1>

      <h2 className="font-display text-xl tracking-wide mb-4 text-text-muted">Now Showing</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 mb-12">
        {NOW_SHOWING.map((m) => (
          <MovieCard key={m.slug} movie={m} />
        ))}
      </div>

      <h2 className="font-display text-xl tracking-wide mb-4 text-text-muted">Coming Soon</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {COMING_SOON.map((m) => (
          <MovieCard key={m.slug} movie={m} />
        ))}
      </div>
    </div>
  );
}
