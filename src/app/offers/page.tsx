import { format } from "date-fns";
import type { DiscountType } from "@prisma/client";
import { getActivePromotions } from "@/lib/promotions";

function discountLabel(discountType: DiscountType, discountValue: number) {
  // FIXED_AMOUNT and COMBO both resolve to a flat amount off — see
  // applyDiscount() in pricing.ts.
  return discountType === "PERCENTAGE" ? `${discountValue.toFixed(0)}% OFF` : `฿${discountValue.toFixed(0)} OFF`;
}

export default async function OffersPage() {
  const promotions = await getActivePromotions();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl tracking-wide mb-8">Offers</h1>

      {promotions.length === 0 ? (
        <p className="text-sm text-text-muted">No active offers right now — check back soon.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {promotions.map((p) => (
            <div key={p.id} className="rounded-lg border border-velvet-red-bright/40 bg-bg-elevated p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-2xl tracking-wide text-marquee-gold">{p.title}</p>
                <span className="shrink-0 rounded-md bg-bg-card px-2 py-1 font-mono text-xs text-text-muted">
                  {p.code}
                </span>
              </div>
              <p className="mt-2 text-sm text-text-muted">{p.description}</p>
              <p className="mt-3 text-sm font-semibold text-marquee-gold">
                {discountLabel(p.discountType, p.discountValue.toNumber())}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Valid through {format(p.validTo, "MMM d, yyyy")}
                {p.minSpend ? ` · Min. spend ฿${p.minSpend.toNumber().toFixed(0)}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
