import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ScreensTable } from "./screens-table";

export default async function AdminScreensPage() {
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

  const screens = await prisma.screen.findMany({
    select: { id: true, name: true, type: true, capacity: true, cinema: { select: { name: true } } },
    orderBy: [{ cinema: { name: "asc" } }, { name: "asc" }],
  });

  const rows = screens.map((s) => ({
    id: s.id,
    name: s.name,
    cinemaName: s.cinema.name,
    type: s.type,
    capacity: s.capacity,
  }));

  return (
    <div className="p-6">
      <ScreensTable screens={rows} />
    </div>
  );
}
