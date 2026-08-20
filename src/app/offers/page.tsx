const OFFERS = [
  { title: "Tuesday Movie Night", detail: "20% OFF all tickets every Tuesday" },
  { title: "Student Discount", detail: "15% OFF with a valid student ID" },
  { title: "2 Tickets + Popcorn Combo", detail: "฿499 flat, any Standard showtime" },
];

export default function OffersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl tracking-wide mb-8">Offers</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {OFFERS.map((o) => (
          <div key={o.title} className="rounded-lg border border-velvet-red-bright/40 bg-bg-elevated p-6">
            <p className="font-display text-2xl tracking-wide text-marquee-gold">{o.title}</p>
            <p className="mt-2 text-sm text-text-muted">{o.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
