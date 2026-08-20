import Image from "next/image";
import Link from "next/link";
import { Play, Ticket, Sparkles } from "lucide-react";
import { MovieCard } from "@/components/movies/movie-card";
import { getNowShowing, getComingSoon } from "@/lib/movies";

const FORMATS = [
  { name: "IMAX", blurb: "Larger-than-life screens with immersive sound" },
  { name: "4DX", blurb: "Motion seats and environmental effects" },
  { name: "Dolby Atmos", blurb: "Sound that moves around you" },
  { name: "VIP", blurb: "Reclining seats and dedicated service" },
];

export default async function Home() {
  const [nowShowing, comingSoon] = await Promise.all([getNowShowing(), getComingSoon()]);
  const featured = nowShowing[0];

  return (
    <div>
      {/* Hero */}
      {featured && (
        <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden">
          <Image src={featured.backdropUrl} alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/20 to-transparent" />

          <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-16 sm:px-6 lg:px-8">
            <div className="max-w-xl space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-marquee-gold">Now Showing</p>
              <h1 className="font-display text-6xl sm:text-7xl leading-none tracking-wide text-text-primary">
                {featured.title.toUpperCase()}
              </h1>
              <p className="text-sm text-text-muted">
                {featured.genres.join(" · ")} · {Math.floor(featured.durationMins / 60)}h{" "}
                {featured.durationMins % 60}m
              </p>
              <p className="text-text-primary/90 max-w-md">{featured.synopsis}</p>
              <div className="flex items-center gap-2 font-mono text-marquee-gold text-sm">
                <span className="rounded border border-marquee-gold-dim px-1.5 py-0.5">
                  {featured.rating.toFixed(1)}/10
                </span>
                <span className="text-text-muted">{featured.ageRating}</span>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href={`/movies/${featured.slug}`}
                  className="flex items-center gap-2 rounded-md bg-marquee-gold px-5 py-3 text-sm font-semibold text-bg hover:brightness-110 transition"
                >
                  <Ticket className="h-4 w-4" />
                  Book Tickets
                </Link>
                <button className="flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold text-text-primary hover:bg-bg-elevated transition">
                  <Play className="h-4 w-4" />
                  Watch Trailer
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="sprocket-divider" />

      <Section title="Now Showing" href="/movies">
        <Rail>
          {nowShowing.map((m) => (
            <MovieCard key={m.slug} movie={m} />
          ))}
        </Rail>
      </Section>

      <Section title="Trending Near You" href="/movies">
        <Rail>
          {[...nowShowing].reverse().map((m) => (
            <MovieCard key={m.slug} movie={m} />
          ))}
        </Rail>
      </Section>

      <Section title="Coming Soon" href="/movies?status=coming-soon">
        <Rail>
          {comingSoon.map((m) => (
            <MovieCard key={m.slug} movie={m} />
          ))}
        </Rail>
      </Section>

      <div className="sprocket-divider" />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="h-4 w-4 text-marquee-gold" />
          <h2 className="font-display text-2xl tracking-wide">Premium Experiences</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {FORMATS.map((f) => (
            <div
              key={f.name}
              className="rounded-lg border border-border bg-bg-elevated p-5 hover:border-marquee-gold-dim transition-colors"
            >
              <p className="font-display text-xl tracking-wide text-marquee-gold">{f.name}</p>
              <p className="mt-1 text-sm text-text-muted">{f.blurb}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-2xl tracking-wide">{title}</h2>
        <Link href={href} className="text-xs text-text-muted hover:text-marquee-gold transition-colors">
          See all
        </Link>
      </div>
      {children}
    </section>
  );
}

function Rail({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-4 overflow-x-auto pb-2">{children}</div>;
}
