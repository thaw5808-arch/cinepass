import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { CinemasTable } from "./cinemas-table";

export default async function AdminCinemasPage() {
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

  const cinemas = await prisma.cinema.findMany({
    select: { id: true, name: true, city: true, address: true, formats: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6">
      <CinemasTable cinemas={cinemas} />
    </div>
  );
}
