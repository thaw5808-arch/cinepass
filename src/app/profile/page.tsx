const SECTIONS = [
  "Profile information",
  "Favorite movies",
  "Favorite cinemas",
  "Booking history",
  "Payment methods",
  "Notifications",
  "Preferences",
  "Account settings",
];

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl tracking-wide mb-8">Profile</h1>
      <div className="grid sm:grid-cols-2 gap-3">
        {SECTIONS.map((s) => (
          <button
            key={s}
            className="rounded-md border border-border bg-bg-elevated px-4 py-3.5 text-left text-sm hover:border-marquee-gold-dim transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
