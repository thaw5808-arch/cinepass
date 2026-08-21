"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { SeatMapSeat } from "@/components/seating/seat-map";
import { generateBookingRef } from "@/lib/booking-ref";

export type FoodCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type ShowtimeInfo = {
  showtimeId: string;
  movieTitle: string;
  movieSlug: string;
  posterUrl: string;
  cinemaName: string;
  screenName: string;
  showtimeLabel: string;
};

type PaymentMethod = "CARD" | "QR" | "BANK_TRANSFER" | "WALLET" | "APPLE_PAY" | "GOOGLE_PAY";

export type AppliedPromo = {
  code: string;
  // Preview only, computed by applyPromoCodeAction — never trusted as the
  // real charge. confirmBookingAction re-validates the code and recomputes
  // this from the server's own totals at booking time (see actions/booking.ts).
  discount: number;
};

type BookingState = {
  showtime: ShowtimeInfo;
  selectedSeats: SeatMapSeat[];
  setSelectedSeats: (seats: SeatMapSeat[]) => void;
  foodCart: FoodCartItem[];
  addFoodItem: (item: { id: string; name: string; price: number }) => void;
  removeFoodItem: (id: string) => void;
  setFoodQuantity: (id: string, quantity: number) => void;
  paymentMethod: PaymentMethod | null;
  setPaymentMethod: (m: PaymentMethod) => void;
  bookingRef: string;
  appliedPromo: AppliedPromo | null;
  setAppliedPromo: (promo: AppliedPromo | null) => void;
  ticketsTotal: number;
  foodTotal: number;
  bookingFee: number;
  discount: number;
  total: number;
};

const BOOKING_FEE = 20;

const BookingContext = createContext<BookingState | null>(null);

export function BookingProvider({
  showtime,
  children,
}: {
  showtime: ShowtimeInfo;
  children: ReactNode;
}) {
  const [selectedSeats, setSelectedSeats] = useState<SeatMapSeat[]>([]);
  const [foodCart, setFoodCart] = useState<FoodCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [bookingRef] = useState(() => generateBookingRef());
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  const addFoodItem = (item: { id: string; name: string; price: number }) => {
    setFoodCart((prev) => {
      const existing = prev.find((f) => f.id === item.id);
      if (existing) {
        return prev.map((f) => (f.id === item.id ? { ...f, quantity: f.quantity + 1 } : f));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFoodItem = (id: string) => {
    setFoodCart((prev) => prev.filter((f) => f.id !== id));
  };

  const setFoodQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeFoodItem(id);
    setFoodCart((prev) => prev.map((f) => (f.id === id ? { ...f, quantity } : f)));
  };

  const ticketsTotal = useMemo(
    () => selectedSeats.reduce((sum, s) => sum + s.price, 0),
    [selectedSeats]
  );
  const foodTotal = useMemo(
    () => foodCart.reduce((sum, f) => sum + f.price * f.quantity, 0),
    [foodCart]
  );
  const discount = appliedPromo?.discount ?? 0;
  const total = ticketsTotal + foodTotal + (selectedSeats.length > 0 ? BOOKING_FEE : 0) - discount;

  return (
    <BookingContext.Provider
      value={{
        showtime,
        selectedSeats,
        setSelectedSeats,
        foodCart,
        addFoodItem,
        removeFoodItem,
        setFoodQuantity,
        paymentMethod,
        setPaymentMethod,
        bookingRef,
        appliedPromo,
        setAppliedPromo,
        ticketsTotal,
        foodTotal,
        bookingFee: selectedSeats.length > 0 ? BOOKING_FEE : 0,
        discount,
        total,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within a BookingProvider");
  return ctx;
}
