import { MapPin, Navigation } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { FavoriteButton } from "@/components/favorite-button";

export default async function CinemasPage() {
  const [cinemas, user] = await Promise.all([
    prisma.cinema.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { screens: true } } },
    }),
    getCurrentUser(),
  ]);

  const favoriteCinemas = user
    ? await prisma.favoriteCinema.findMany({ where: { userId: user.id }, select: { cinemaId: true } })
    : [];
  const favoritedIds = new Set(favoriteCinemas.map((f) => f.cinemaId));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl tracking-wide mb-8">Cinemas Near You</h1>
      {cinemas.length === 0 ? (
        <p className="text-sm text-text-muted">No cinemas yet.</p>
      ) : (
        <div className="space-y-4">
          {cinemas.map((c) => (
            <div
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border bg-bg-elevated p-5"
            >
              <div className="min-w-0">
                <h2 className="font-display text-xl tracking-wide">{c.name}</h2>
                <p className="flex items-center gap-1 text-sm text-text-muted mt-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {c.address}, {c.city}
                </p>
                <p className="text-sm text-marquee-gold mt-1">
                  {c.formats.join(" · ")} · {c._count.screens} screen{c._count.screens === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="rounded-md bg-marquee-gold px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 transition">
                  View Showtimes
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm hover:bg-bg-card transition">
                  <Navigation className="h-3.5 w-3.5" />
                  Directions
                </button>
                <FavoriteButton kind="cinema" id={c.id} initialFavorited={favoritedIds.has(c.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
