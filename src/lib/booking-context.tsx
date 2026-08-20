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
  ticketsTotal: number;
  foodTotal: number;
  bookingFee: number;
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
  const total = ticketsTotal + foodTotal + (selectedSeats.length > 0 ? BOOKING_FEE : 0);

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
        ticketsTotal,
        foodTotal,
        bookingFee: selectedSeats.length > 0 ? BOOKING_FEE : 0,
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
