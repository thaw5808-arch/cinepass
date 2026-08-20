"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Clapperboard, Search, Ticket, ChevronDown, User, LogOut, Menu, X } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import type { CurrentUser } from "@/lib/session";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/cinemas", label: "Cinemas" },
  { href: "/showtimes", label: "Showtimes" },
  { href: "/my-tickets", label: "My Tickets" },
  { href: "/offers", label: "Offers" },
];

export function Navbar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // /staff and /admin get their own minimal role-specific shells (see
  // RoleHeader) instead of the customer nav — three distinct layouts, not
  // the customer site with extra chrome bolted on.
  if (pathname.startsWith("/staff") || pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Clapperboard className="h-6 w-6 text-marquee-gold" strokeWidth={1.75} />
          <span className="font-display text-2xl tracking-wide text-text-primary">CINEPASS</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(link.href)
                  ? "text-marquee-gold"
                  : "text-text-muted hover:text-text-primary"
              }`}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <button
            aria-label="Search"
            className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
          {user ? (
            <AccountMenu user={user} />
          ) : (
            <Link
              href="/login"
              className="px-3 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              Log In
            </Link>
          )}
          <Link
            href="/movies"
            className="flex items-center gap-2 rounded-md bg-marquee-gold px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 transition"
          >
            <Ticket className="h-4 w-4" />
            Book Tickets
          </Link>
        </div>

        <button
          className="lg:hidden p-2 text-text-primary"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border bg-bg px-4 py-3 space-y-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2.5 text-base font-medium ${
                isActive(link.href) ? "text-marquee-gold bg-bg-elevated" : "text-text-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <div className="mt-2 space-y-1 border-t border-border pt-3">
              <p className="px-3 pb-1 text-xs uppercase tracking-wide text-text-muted">
                Signed in as {user.name}
              </p>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2.5 text-base font-medium text-text-muted"
              >
                Profile
              </Link>
              <Link
                href="/my-tickets"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2.5 text-base font-medium text-text-muted"
              >
                My Tickets
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="block w-full rounded-md px-3 py-2.5 text-left text-base font-medium text-velvet-red-bright"
                >
                  Log Out
                </button>
              </form>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!user && (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-md border border-border py-2.5 text-center text-sm text-text-primary"
              >
                Log In
              </Link>
            )}
            <Link
              href="/movies"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md bg-marquee-gold py-2.5 text-center text-sm font-semibold text-bg"
            >
              Book Tickets
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function AccountMenu({ user }: { user: NonNullable<CurrentUser> }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2.5 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-marquee-gold text-xs font-semibold text-bg">
          {initial}
        </span>
        <span className="max-w-[8rem] truncate text-sm font-medium text-text-primary">{user.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-bg-elevated py-1 shadow-lg"
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-primary hover:bg-bg-card"
          >
            <User className="h-4 w-4 text-text-muted" />
            Profile
          </Link>
          <Link
            href="/my-tickets"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-primary hover:bg-bg-card"
          >
            <Ticket className="h-4 w-4 text-text-muted" />
            My Tickets
          </Link>
          <div className="my-1 border-t border-border" />
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-velvet-red-bright hover:bg-bg-card"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
