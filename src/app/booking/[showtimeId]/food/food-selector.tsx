"use client";

import { useRouter } from "next/navigation";
import { Minus, Plus, X } from "lucide-react";
import { FoodCategory } from "@prisma/client";
import { useBooking } from "@/lib/booking-context";

export type FoodMenuItem = {
  id: string;
  name: string;
  category: FoodCategory;
  price: number;
};

const FOOD_CATEGORIES: FoodCategory[] = ["POPCORN", "DRINKS", "SNACKS", "COMBOS", "HOT_FOOD"];

const FOOD_CATEGORY_LABEL: Record<FoodCategory, string> = {
  POPCORN: "Popcorn",
  DRINKS: "Drinks",
  SNACKS: "Snacks",
  COMBOS: "Combos",
  HOT_FOOD: "Hot Food",
};

export function FoodSelector({ items }: { items: FoodMenuItem[] }) {
  const router = useRouter();
  const { showtime, foodCart, addFoodItem, setFoodQuantity, removeFoodItem, foodTotal } =
    useBooking();

  const quantityOf = (id: string) => foodCart.find((f) => f.id === id)?.quantity ?? 0;

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide mb-1">Make Your Movie Experience Better</h1>
      <p className="text-sm text-text-muted mb-8">Optional — skip this step any time.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          {FOOD_CATEGORIES.map((cat) => {
            const catItems = items.filter((f) => f.category === cat);
            if (catItems.length === 0) return null;
            return (
              <section key={cat}>
                <h2 className="font-display text-xl tracking-wide mb-3">
                  {FOOD_CATEGORY_LABEL[cat]}
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {catItems.map((item) => {
                    const qty = quantityOf(item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-elevated p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-text-primary">{item.name}</p>
                          <p className="text-sm text-marquee-gold font-mono mt-1">฿{item.price}</p>
                        </div>

                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => addFoodItem(item)}
                            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-marquee-gold hover:text-marquee-gold transition-colors"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex shrink-0 items-center gap-1">
                            <StepperButton
                              icon={<Minus className="h-3.5 w-3.5" />}
                              onClick={() => setFoodQuantity(item.id, qty - 1)}
                              label={`Decrease ${item.name}`}
                            />
                            <span className="w-5 text-center font-mono text-sm">{qty}</span>
                            <StepperButton
                              icon={<Plus className="h-3.5 w-3.5" />}
                              onClick={() => setFoodQuantity(item.id, qty + 1)}
                              label={`Increase ${item.name}`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="sticky top-24 h-fit rounded-lg border border-border bg-bg-elevated p-5 space-y-4">
          <h3 className="font-display text-lg tracking-wide">Your Order</h3>
          {foodCart.length === 0 ? (
            <p className="text-sm text-text-muted">Nothing added yet</p>
          ) : (
            <ul className="space-y-2">
              {foodCart.map((f) => (
                <li key={f.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary">
                    {f.name} ×{f.quantity}
                  </span>
                  <span className="flex items-center gap-2 font-mono text-text-muted">
                    ฿{f.price * f.quantity}
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => removeFoodItem(f.id)}
                      className="text-text-muted hover:text-velvet-red-bright"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-sm text-text-muted">Food total</span>
            <span className="font-display text-xl text-marquee-gold">฿{foodTotal.toFixed(0)}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/booking/${showtime.showtimeId}/checkout`)}
            className="w-full rounded-md bg-marquee-gold py-3 text-sm font-semibold text-bg hover:brightness-110 transition"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => router.push(`/booking/${showtime.showtimeId}/checkout`)}
            className="w-full text-center text-xs text-text-muted hover:text-text-primary"
          >
            Skip this step
          </button>
        </div>
      </div>
    </div>
  );
}

function StepperButton({
  icon,
  onClick,
  label,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded border border-border text-text-muted hover:border-marquee-gold hover:text-marquee-gold transition-colors"
    >
      {icon}
    </button>
  );
}
