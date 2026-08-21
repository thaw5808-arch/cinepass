import { format } from "date-fns";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const STATUS_BADGE: Record<PaymentStatus, string> = {
  SUCCESS: "bg-marquee-gold/10 text-marquee-gold",
  PENDING: "bg-bg-elevated text-text-muted",
  FAILED: "bg-velvet-red-bright/10 text-velvet-red-bright",
  REFUNDED: "bg-screen-glow/10 text-screen-glow",
};

const METHOD_LABEL: Record<string, string> = {
  CARD: "Card",
  QR: "QR",
  BANK_TRANSFER: "Bank Transfer",
  WALLET: "Wallet",
  APPLE_PAY: "Apple Pay",
  GOOGLE_PAY: "Google Pay",
};

export default async function AdminPaymentsPage() {
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

  const payments = await prisma.payment.findMany({
    include: {
      booking: { select: { bookingRef: true, user: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = payments.map((p) => ({
    id: p.id,
    bookingRef: p.booking.bookingRef,
    customerName: p.booking.user.name,
    customerEmail: p.booking.user.email,
    method: p.method,
    amount: p.amount.toNumber(),
    status: p.status,
    paidAtLabel: p.paidAt ? format(p.paidAt, "MMM d, yyyy · h:mm a") : "—",
    refundedAtLabel: p.refundedAt ? format(p.refundedAt, "MMM d, yyyy · h:mm a") : null,
  }));

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Payments</h1>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated text-text-muted text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Booking Ref</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Paid At</th>
              <th className="px-4 py-3 font-medium">Refunded At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  No payments yet.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="bg-bg-card">
                  <td className="px-4 py-3 font-mono text-text-primary">{p.bookingRef}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {p.customerName}
                    <span className="block text-xs text-text-muted/70">{p.customerEmail}</span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{METHOD_LABEL[p.method] ?? p.method}</td>
                  <td className="px-4 py-3 text-text-muted font-mono">฿{p.amount.toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${STATUS_BADGE[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted font-mono">{p.paidAtLabel}</td>
                  <td className="px-4 py-3 text-text-muted font-mono">{p.refundedAtLabel ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
