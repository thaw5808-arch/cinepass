"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { DiscountType } from "@prisma/client";
import { deletePromotionAction } from "@/lib/actions/promotions";

export type PromotionRow = {
  id: string;
  code: string;
  title: string;
  discountType: DiscountType;
  discountValue: number;
  validFromLabel: string;
  validToLabel: string;
  active: boolean;
  usedCount: number;
  usageLimit: number | null;
};

function discountLabel(discountType: DiscountType, discountValue: number) {
  return discountType === "PERCENTAGE" ? `${discountValue.toFixed(0)}% off` : `฿${discountValue.toFixed(0)} off`;
}

export function PromotionsTable({ promotions }: { promotions: PromotionRow[] }) {
  const [rows, setRows] = useState(promotions);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string | undefined>>({});

  const remove = async (id: string) => {
    setPendingId(id);
    setErrorById((prev) => ({ ...prev, [id]: undefined }));

    const result = await deletePromotionAction(id);
    setPendingId(null);

    if (!result.ok) {
      setErrorById((prev) => ({ ...prev, [id]: result.error }));
      return;
    }
    setConfirmingId(null);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl tracking-wide">Promotions</h1>
        <Link
          href="/admin/promotions/new"
          className="flex items-center gap-2 rounded-md bg-marquee-gold px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4" />
          Add Promotion
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated text-text-muted text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Valid Dates</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  No promotions yet.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="bg-bg-card">
                  <td className="px-4 py-3 font-mono text-text-primary">{p.code}</td>
                  <td className="px-4 py-3 text-text-primary">{p.title}</td>
                  <td className="px-4 py-3 text-text-muted">{discountLabel(p.discountType, p.discountValue)}</td>
                  <td className="px-4 py-3 text-text-muted font-mono">
                    {p.validFromLabel} – {p.validToLabel}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        p.active
                          ? "bg-marquee-gold/10 text-marquee-gold"
                          : "bg-bg-elevated text-text-muted"
                      }`}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted font-mono">
                    {p.usedCount} / {p.usageLimit ?? "∞"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {errorById[p.id] && (
                        <span className="text-xs text-velvet-red-bright">{errorById[p.id]}</span>
                      )}
                      {confirmingId === p.id ? (
                        <span className="flex items-center gap-2 text-xs">
                          <span className="text-text-muted">Delete permanently?</span>
                          <button
                            onClick={() => remove(p.id)}
                            disabled={pendingId === p.id}
                            className="rounded-md bg-velvet-red-bright px-2.5 py-1 font-semibold text-text-primary disabled:opacity-60"
                          >
                            {pendingId === p.id ? "Deleting…" : "Confirm"}
                          </button>
                          <button
                            onClick={() => {
                              setConfirmingId(null);
                              setErrorById((prev) => ({ ...prev, [p.id]: undefined }));
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
                            href={`/admin/promotions/${p.id}/edit`}
                            aria-label={`Edit ${p.title}`}
                            className="rounded p-1.5 text-text-muted hover:text-marquee-gold hover:bg-bg-elevated"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            aria-label={`Delete ${p.title}`}
                            onClick={() => setConfirmingId(p.id)}
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
