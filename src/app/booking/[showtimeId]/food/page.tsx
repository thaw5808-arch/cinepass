import { getAvailableFoodItems } from "@/lib/food";
import { FoodSelector } from "./food-selector";

export default async function FoodPage() {
  const items = await getAvailableFoodItems();

  return (
    <FoodSelector
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        price: i.price.toNumber(),
      }))}
    />
  );
}
