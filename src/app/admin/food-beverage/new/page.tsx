import { FoodItemForm } from "../food-item-form";

// No independent ADMIN check here — this page fetches no data of its own
// (the form starts blank), and createFoodItemAction() checks ADMIN
// independently before writing anything. See admin/food-beverage/page.tsx
// and .../[id]/edit/page.tsx for pages that *do* need the check, because
// they run a real query on render.
export default function NewFoodItemPage() {
  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Add Food & Beverage Item</h1>
      <FoodItemForm mode="create" />
    </div>
  );
}
