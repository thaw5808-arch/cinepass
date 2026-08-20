import { MapPin, Navigation } from "lucide-react";

const CINEMAS = [
  { name: "CinePass CentralWorld", location: "Pathum Wan, Bangkok", distance: "2.1 km", formats: ["IMAX", "VIP", "Dolby Atmos"], screens: 9 },
  { name: "CinePass IconSiam", location: "Khlong San, Bangkok", distance: "5.4 km", formats: ["4DX", "Dolby Atmos"], screens: 7 },
  { name: "CinePass Mega Bangna", location: "Bang Phli, Samut Prakan", distance: "8.9 km", formats: ["IMAX", "Standard"], screens: 11 },
];

export default function CinemasPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl tracking-wide mb-8">Cinemas Near You</h1>
      <div className="space-y-4">
        {CINEMAS.map((c) => (
          <div
            key={c.name}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border bg-bg-elevated p-5"
          >
            <div>
              <h2 className="font-display text-xl tracking-wide">{c.name}</h2>
              <p className="flex items-center gap-1 text-sm text-text-muted mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {c.location} · {c.distance} away
              </p>
              <p className="text-sm text-marquee-gold mt-1">
                {c.formats.join(" · ")} · {c.screens} screens
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="rounded-md bg-marquee-gold px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 transition">
                View Showtimes
              </button>
              <button className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm hover:bg-bg-card transition">
                <Navigation className="h-3.5 w-3.5" />
                Directions
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
