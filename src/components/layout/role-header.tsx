import Link from "next/link";
import { Clapperboard, LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import type { CurrentUser } from "@/lib/session";

/**
 * Minimal shell header for the staff and admin layouts — logo, a role
 * badge, and the current user's name/logout. Deliberately carries none of
 * the customer Navbar's links (movies, cinemas, "Book Tickets", ...); the
 * two areas are meant to read as distinct tools, not the customer site
 * with extra chrome bolted on.
 */
export function RoleHeader({ label, user }: { label: string; user: NonNullable<CurrentUser> }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Clapperboard className="h-6 w-6 text-marquee-gold" strokeWidth={1.75} />
          <span className="font-display text-2xl tracking-wide text-text-primary">CINEPASS</span>
          <span className="ml-1 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">
            {label}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-text-muted">{user.name}</span>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-text-muted hover:text-velvet-red-bright hover:bg-bg-elevated transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
