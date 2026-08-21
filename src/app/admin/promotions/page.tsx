import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PromotionsTable } from "./promotions-table";

export default async function AdminPromotionsPage() {
  // Independent ADMIN check — this page runs a real query on render, same
  // reasoning as admin/customers/page.tsx: a parent layout skipping
  // {children} on a stale client-side transition doesn't stop this page's
  // own data fetch from running, so the check has to live here too.
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="p-6">
        <p className="text-sm text-text-muted">
          The admin dashboard is restricted to administrators.
        </p>
      </div>
    );
  }

  const promotions = await prisma.promotion.findMany({
    orderBy: { validFrom: "desc" },
  });

  const rows = promotions.map((p) => ({
    id: p.id,
    code: p.code,
    title: p.title,
    discountType: p.discountType,
    discountValue: p.discountValue.toNumber(),
    validFromLabel: format(p.validFrom, "MMM d, yyyy"),
    validToLabel: format(p.validTo, "MMM d, yyyy"),
    active: p.active,
    usedCount: p.usedCount,
    usageLimit: p.usageLimit,
  }));

  return (
    <div className="p-6">
      <PromotionsTable promotions={rows} />
    </div>
  );
}
