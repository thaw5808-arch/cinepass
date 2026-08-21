"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Movies", href: "/admin/movies" },
  { label: "Cinemas", href: "/admin/cinemas" },
  { label: "Screens", href: "/admin/screens" },
  { label: "Seats", href: "/admin/seats" },
  { label: "Showtimes", href: "/admin/showtimes" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Food & Beverage", href: "/admin/food-beverage" },
  { label: "Promotions", href: "/admin/promotions" },
  // Ticket scanning lives under /staff, not /admin — shared tool, not an
  // admin-only page, so it's linked here rather than duplicated.
  { label: "Ticket Validation", href: "/staff/validate" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Settings", href: "/admin/settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className="hidden md:block w-56 shrink-0 border-r border-border bg-bg-elevated p-4">
      <nav className="space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`block rounded-md px-3 py-2 text-sm transition-colors ${
              isActive(item.href)
                ? "bg-marquee-gold/10 text-marquee-gold"
                : "text-text-muted hover:text-text-primary hover:bg-bg-card"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
