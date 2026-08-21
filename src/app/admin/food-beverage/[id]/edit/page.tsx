import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { FoodItemForm, type FoodItemFormDefaults } from "../../food-item-form";

export default async function EditFoodItemPage({ params }: { params: Promise<{ id: string }> }) {
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

  const item = await prisma.foodItem.findUnique({ where: { id } });
  if (!item) notFound();

  const defaultValues: FoodItemFormDefaults = {
    name: item.name,
    category: item.category,
    price: item.price.toNumber(),
    imageUrl: item.imageUrl ?? "",
    available: item.available,
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Edit Food & Beverage Item</h1>
      <FoodItemForm mode="edit" foodItemId={item.id} defaultValues={defaultValues} />
    </div>
  );
}
