"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, QrCode, Landmark, Wallet, Loader2, AlertCircle } from "lucide-react";
import { useBooking } from "@/lib/booking-context";
import { confirmBookingAction } from "@/lib/actions/booking";

type PaymentMethodOption = {
  id: "CARD" | "QR" | "BANK_TRANSFER" | "WALLET" | "APPLE_PAY" | "GOOGLE_PAY";
  label: string;
  icon: React.ReactNode;
};

const METHODS: PaymentMethodOption[] = [
  { id: "CARD", label: "Credit / Debit Card", icon: <CreditCard className="h-5 w-5" /> },
  { id: "QR", label: "QR Payment", icon: <QrCode className="h-5 w-5" /> },
  { id: "BANK_TRANSFER", label: "Bank Transfer", icon: <Landmark className="h-5 w-5" /> },
  { id: "WALLET", label: "Digital Wallet", icon: <Wallet className="h-5 w-5" /> },
];

type PaymentStatus = "IDLE" | "PENDING" | "FAILED";

const DEFAULT_DECLINE_MESSAGE = "Payment failed. Your seats are still held — you can try again.";

export default function PaymentPage() {
  const router = useRouter();
  const { showtime, selectedSeats, foodCart, total, paymentMethod, setPaymentMethod } = useBooking();
  const [status, setStatus] = useState<PaymentStatus>("IDLE");
  const [errorMessage, setErrorMessage] = useState(DEFAULT_DECLINE_MESSAGE);

  // NOTE: the gateway round-trip itself is still simulated client-side —
  // swap this timeout for a real charge call when wiring up a provider.
  // Once it reports success, though, everything downstream is real:
  // confirmBookingAction() re-verifies the seat holds server-side and
  // writes the Booking/Payment/Ticket rows — a client-reported "success"
  // is never trusted on its own.
  const handlePay = () => {
    if (!paymentMethod) return;
    setStatus("PENDING");
    setTimeout(async () => {
      const succeeded = Math.random() > 0.08; // occasional simulated decline
      if (!succeeded) {
        setErrorMessage(DEFAULT_DECLINE_MESSAGE);
        setStatus("FAILED");
        return;
      }

      const result = await confirmBookingAction({
        showtimeId: showtime.showtimeId,
        showtimeSeatIds: selectedSeats.map((s) => s.id),
        foodItems: foodCart.map((f) => ({ id: f.id, quantity: f.quantity })),
        paymentMethod,
      });

      if (result.ok) {
        router.push(`/booking/${showtime.showtimeId}/confirmation?booking=${result.bookingId}`);
      } else {
        setErrorMessage(result.error);
        setStatus("FAILED");
      }
    }, 1600);
  };

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl tracking-wide mb-8">Payment</h1>

      <div className="space-y-2 mb-6">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setPaymentMethod(m.id)}
            disabled={status === "PENDING"}
            className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-sm transition-colors disabled:opacity-50 ${
              paymentMethod === m.id
                ? "border-marquee-gold bg-marquee-gold/10 text-marquee-gold"
                : "border-border text-text-primary hover:border-text-muted"
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {status === "FAILED" && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-velvet-red-bright/60 bg-velvet-red-bright/10 px-4 py-3 text-sm text-velvet-red-bright">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <div className="flex items-baseline justify-between rounded-lg border border-border bg-bg-elevated p-5 mb-6">
        <span className="text-sm text-text-muted">Total to pay</span>
        <span className="font-display text-2xl text-marquee-gold">฿{total.toFixed(0)}</span>
      </div>

      <button
        type="button"
        disabled={!paymentMethod || status === "PENDING"}
        onClick={handlePay}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-marquee-gold py-3.5 text-sm font-semibold text-bg hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "PENDING" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing payment...
          </>
        ) : (
          `Pay ฿${total.toFixed(0)}`
        )}
      </button>
    </div>
  );
}
