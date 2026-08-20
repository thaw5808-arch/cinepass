import { MovieCard } from "@/components/movies/movie-card";
import { getNowShowing, getComingSoon } from "@/lib/movies";

export default async function MoviesPage() {
  const [nowShowing, comingSoon] = await Promise.all([getNowShowing(), getComingSoon()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl tracking-wide mb-8">Movies</h1>

      <h2 className="font-display text-xl tracking-wide mb-4 text-text-muted">Now Showing</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 mb-12">
        {nowShowing.length === 0 ? (
          <p className="col-span-full text-sm text-text-muted">Nothing currently showing.</p>
        ) : (
          nowShowing.map((m) => <MovieCard key={m.slug} movie={m} />)
        )}
      </div>

      <h2 className="font-display text-xl tracking-wide mb-4 text-text-muted">Coming Soon</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {comingSoon.length === 0 ? (
          <p className="col-span-full text-sm text-text-muted">Nothing coming soon yet.</p>
        ) : (
          comingSoon.map((m) => <MovieCard key={m.slug} movie={m} />)
        )}
      </div>
    </div>
  );
}
