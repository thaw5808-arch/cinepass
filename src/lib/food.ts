import { prisma } from "@/lib/prisma";

// Server-only — deliberately doesn't export plain constants alongside this,
// even client-safe ones. A "use client" file importing anything from this
// module would pull in prisma.ts's whole import chain (@prisma/adapter-pg
// -> pg -> Node built-ins like `tls`), breaking the client bundle. Keep
// category labels/lists defined locally where they're used instead (same
// pattern movies-table.tsx/movie-form.tsx already use for MovieStatus).

/** Customer-facing catalog — only what's currently marked available. */
export function getAvailableFoodItems() {
  return prisma.foodItem.findMany({
    where: { available: true },
    orderBy: { name: "asc" },
  });
}
