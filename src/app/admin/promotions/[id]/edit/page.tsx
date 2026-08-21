import { format } from "date-fns";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PromotionForm, type PromotionFormDefaults } from "../../promotion-form";

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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

  const promotion = await prisma.promotion.findUnique({ where: { id } });
  if (!promotion) notFound();

  const defaultValues: PromotionFormDefaults = {
    code: promotion.code,
    title: promotion.title,
    description: promotion.description,
    discountType: promotion.discountType,
    discountValue: promotion.discountValue.toNumber(),
    minSpend: promotion.minSpend ? promotion.minSpend.toNumber() : "",
    validFrom: format(promotion.validFrom, "yyyy-MM-dd'T'HH:mm"),
    validTo: format(promotion.validTo, "yyyy-MM-dd'T'HH:mm"),
    active: promotion.active,
    usageLimit: promotion.usageLimit ?? "",
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Edit Promotion</h1>
      <PromotionForm mode="edit" promotionId={promotion.id} defaultValues={defaultValues} />
    </div>
  );
}
