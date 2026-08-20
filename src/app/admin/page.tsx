const STATS = [
  { label: "Today's Revenue", value: "฿182,400" },
  { label: "Tickets Sold", value: "842" },
  { label: "Occupancy", value: "78%" },
  { label: "Bookings", value: "516" },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-bg-elevated p-5">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className="font-display text-3xl text-marquee-gold mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-text-muted">
        Charts for revenue, ticket sales, and occupancy plug in here once booking data exists.
      </p>
    </div>
  );
}
