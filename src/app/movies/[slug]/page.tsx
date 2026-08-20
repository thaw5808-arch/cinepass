import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, Ticket } from "lucide-react";
import { getMovieBySlug, getUpcomingShowtimesForMovie } from "@/lib/movies";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD, in UTC
}

function dateLabel(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit" }).toUpperCase();
}

function timeLabel(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function MovieDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const { date: selectedDateParam } = await searchParams;

  const movie = await getMovieBySlug(slug);
  if (!movie) notFound();

  const showtimes = await getUpcomingShowtimesForMovie(movie.id);

  // Group upcoming showtimes by calendar date, then by cinema/screen.
  const dates = Array.from(new Set(showtimes.map((s) => dateKey(s.startTime)))).sort();
  const selectedDate = selectedDateParam && dates.includes(selectedDateParam) ? selectedDateParam : dates[0];

  const showtimesForDate = showtimes.filter((s) => dateKey(s.startTime) === selectedDate);
  const byVenue = new Map<string, { cinemaName: string; screenName: string; showtimes: typeof showtimes }>();
  for (const st of showtimesForDate) {
    const key = `${st.cinema.name}__${st.screen.name}`;
    if (!byVenue.has(key)) {
      byVenue.set(key, { cinemaName: st.cinema.name, screenName: st.screen.name, showtimes: [] });
    }
    byVenue.get(key)!.showtimes.push(st);
  }

  return (
    <div>
      <section className="relative h-[50vh] min-h-[360px] w-full overflow-hidden">
        <Image src={movie.backdropUrl} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/10" />
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-24 relative">
        <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-8">
          <div className="relative aspect-[2/3] w-44 sm:w-full rounded-lg overflow-hidden border border-border shadow-xl">
            <Image src={movie.posterUrl} alt={`${movie.title} poster`} fill className="object-cover" />
          </div>

          <div className="pt-4 sm:pt-28 space-y-4">
            <h1 className="font-display text-4xl sm:text-5xl tracking-wide">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted font-mono">
              {movie.rating > 0 && (
                <span className="rounded border border-marquee-gold-dim px-1.5 py-0.5 text-marquee-gold">
                  {movie.rating.toFixed(1)}/10
                </span>
              )}
              <span>{movie.ageRating}</span>
              <span>{Math.floor(movie.durationMins / 60)}h {movie.durationMins % 60}m</span>
              <span>{movie.language}</span>
            </div>
            <p className="text-text-muted">{movie.genres.join(" · ")}</p>
            <p className="max-w-2xl text-text-primary/90">{movie.synopsis}</p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#showtimes"
                className="flex items-center gap-2 rounded-md bg-marquee-gold px-5 py-3 text-sm font-semibold text-bg hover:brightness-110 transition"
              >
                <Ticket className="h-4 w-4" />
                Book Tickets
              </a>
              <button className="flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold hover:bg-bg-elevated transition">
                <Play className="h-4 w-4" />
                Watch Trailer
              </button>
            </div>
          </div>
        </div>

        <section id="showtimes" className="py-14">
          {dates.length === 0 ? (
            <p className="text-text-muted">No upcoming showtimes for this movie yet.</p>
          ) : (
            <>
              <h2 className="font-display text-2xl tracking-wide mb-5">Select a Date</h2>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
                {dates.map((d) => (
                  <Link
                    key={d}
                    href={`/movies/${slug}?date=${d}`}
                    scroll={false}
                    className={`shrink-0 rounded-md border px-4 py-2 text-sm font-mono transition-colors ${
                      d === selectedDate
                        ? "border-marquee-gold bg-marquee-gold/10 text-marquee-gold"
                        : "border-border text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {dateLabel(new Date(`${d}T00:00:00Z`))}
                  </Link>
                ))}
              </div>

              {Array.from(byVenue.values()).map((venue) => (
                <div key={`${venue.cinemaName}__${venue.screenName}`} className="mb-8">
                  <h2 className="font-display text-2xl tracking-wide mb-5">
                    {venue.cinemaName} — {venue.screenName}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {venue.showtimes.map((st) => (
                      <Link
                        key={st.id}
                        href={`/booking/${st.id}/seats`}
                        className="rounded-md border border-border px-4 py-2.5 text-sm font-mono hover:border-marquee-gold hover:text-marquee-gold transition-colors"
                      >
                        {timeLabel(st.startTime)}
                        <span className="ml-2 text-text-muted">· {st.format}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
