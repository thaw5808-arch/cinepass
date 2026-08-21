import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { FoodItemsTable } from "./food-items-table";

export default async function AdminFoodBeveragePage() {
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

  const items = await prisma.foodItem.findMany({
    select: { id: true, name: true, category: true, price: true, available: true },
    orderBy: { name: "asc" },
  });

  const rows = items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    price: i.price.toNumber(),
    available: i.available,
  }));

  return (
    <div className="p-6">
      <FoodItemsTable items={rows} />
    </div>
  );
}
