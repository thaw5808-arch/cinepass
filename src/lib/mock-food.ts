export type FoodCategory = "POPCORN" | "DRINKS" | "SNACKS" | "COMBOS" | "HOT_FOOD";

export type FoodCatalogItem = {
  id: string;
  name: string;
  category: FoodCategory;
  price: number;
  description: string;
};

export const FOOD_CATALOG: FoodCatalogItem[] = [
  { id: "popcorn-large", name: "Large Popcorn", category: "POPCORN", price: 150, description: "Classic salted, family-size tub" },
  { id: "popcorn-caramel", name: "Caramel Popcorn", category: "POPCORN", price: 170, description: "Sweet caramel glaze, large tub" },
  { id: "coke", name: "Coke", category: "DRINKS", price: 50, description: "22oz, regular or diet" },
  { id: "iced-tea", name: "Thai Iced Tea", category: "DRINKS", price: 65, description: "House blend, extra creamy" },
  { id: "nachos", name: "Loaded Nachos", category: "SNACKS", price: 130, description: "Cheese sauce, jalapeños, salsa" },
  { id: "hotdog", name: "Classic Hot Dog", category: "HOT_FOOD", price: 110, description: "Beef frank, brioche bun" },
  { id: "combo-duo", name: "Duo Combo", category: "COMBOS", price: 280, description: "2 large popcorns + 2 drinks" },
];

export const FOOD_CATEGORY_LABEL: Record<FoodCategory, string> = {
  POPCORN: "Popcorn",
  DRINKS: "Drinks",
  SNACKS: "Snacks",
  COMBOS: "Combos",
  HOT_FOOD: "Hot Food",
};
