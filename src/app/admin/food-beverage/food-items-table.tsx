"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { FoodCategory } from "@prisma/client";
import { deleteFoodItemAction, toggleFoodItemAvailabilityAction } from "@/lib/actions/food";

export type FoodItemRow = {
  id: string;
  name: string;
  category: FoodCategory;
  price: number;
  available: boolean;
};

const CATEGORY_LABEL: Record<FoodCategory, string> = {
  POPCORN: "Popcorn",
  DRINKS: "Drinks",
  SNACKS: "Snacks",
  COMBOS: "Combos",
  HOT_FOOD: "Hot Food",
};

export function FoodItemsTable({ items }: { items: FoodItemRow[] }) {
  const [rows, setRows] = useState(items);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [toggleErrorById, setToggleErrorById] = useState<Record<string, string | undefined>>({});
  const [deleteErrorById, setDeleteErrorById] = useState<Record<string, string | undefined>>({});

  const toggleAvailable = async (id: string, next: boolean) => {
    setPendingToggleId(id);
    setToggleErrorById((prev) => ({ ...prev, [id]: undefined }));
    // Optimistic — flip immediately, roll back on failure.
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, available: next } : r)));

    const result = await toggleFoodItemAvailabilityAction(id, next);
    setPendingToggleId(null);

    if (!result.ok) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, available: !next } : r)));
      setToggleErrorById((prev) => ({ ...prev, [id]: result.error }));
    }
  };

  const remove = async (id: string) => {
    setPendingDeleteId(id);
    setDeleteErrorById((prev) => ({ ...prev, [id]: undefined }));

    const result = await deleteFoodItemAction(id);
    setPendingDeleteId(null);

    if (!result.ok) {
      setDeleteErrorById((prev) => ({ ...prev, [id]: result.error }));
      return;
    }
    setConfirmingId(null);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl tracking-wide">Food &amp; Beverage</h1>
        <Link
          href="/admin/food-beverage/new"
          className="flex items-center gap-2 rounded-md bg-marquee-gold px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated text-text-muted text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Available</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  No food & beverage items yet.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr key={item.id} className="bg-bg-card">
                  <td className="px-4 py-3 text-text-primary">{item.name}</td>
                  <td className="px-4 py-3 text-text-muted">{CATEGORY_LABEL[item.category]}</td>
                  <td className="px-4 py-3 text-text-muted font-mono">฿{item.price.toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.available}
                        aria-label={`${item.name} is ${item.available ? "available" : "unavailable"} — click to toggle`}
                        disabled={pendingToggleId === item.id}
                        onClick={() => toggleAvailable(item.id, !item.available)}
                        className={`rounded-full px-2.5 py-1 text-xs transition-colors disabled:opacity-60 ${
                          item.available
                            ? "bg-marquee-gold/10 text-marquee-gold hover:bg-marquee-gold/20"
                            : "bg-bg-elevated text-text-muted hover:bg-bg-card"
                        }`}
                      >
                        {pendingToggleId === item.id
                          ? "Updating…"
                          : item.available
                            ? "Available"
                            : "Unavailable"}
                      </button>
                      {toggleErrorById[item.id] && (
                        <span className="text-xs text-velvet-red-bright">{toggleErrorById[item.id]}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deleteErrorById[item.id] && (
                        <span className="text-xs text-velvet-red-bright">{deleteErrorById[item.id]}</span>
                      )}
                      {confirmingId === item.id ? (
                        <span className="flex items-center gap-2 text-xs">
                          <span className="text-text-muted">Delete permanently?</span>
                          <button
                            onClick={() => remove(item.id)}
                            disabled={pendingDeleteId === item.id}
                            className="rounded-md bg-velvet-red-bright px-2.5 py-1 font-semibold text-text-primary disabled:opacity-60"
                          >
                            {pendingDeleteId === item.id ? "Deleting…" : "Confirm"}
                          </button>
                          <button
                            onClick={() => {
                              setConfirmingId(null);
                              setDeleteErrorById((prev) => ({ ...prev, [item.id]: undefined }));
                            }}
                            aria-label="Cancel delete"
                            className="text-text-muted hover:text-text-primary"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ) : (
                        <>
                          <Link
                            href={`/admin/food-beverage/${item.id}/edit`}
                            aria-label={`Edit ${item.name}`}
                            className="rounded p-1.5 text-text-muted hover:text-marquee-gold hover:bg-bg-elevated"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            aria-label={`Delete ${item.name}`}
                            onClick={() => setConfirmingId(item.id)}
                            className="rounded p-1.5 text-text-muted hover:text-velvet-red-bright hover:bg-bg-elevated"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
