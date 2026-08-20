import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ScreenForm } from "../screen-form";

export default async function NewScreenPage() {
  // Independent ADMIN check — unlike admin/movies/new, this page DOES run a
  // real query (the cinema list for the dropdown below), so it needs the
  // same check as admin/customers/page.tsx rather than relying solely on
  // the layout's gate.
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
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Add Screen</h1>
      <ScreenForm mode="create" cinemas={cinemas} />
    </div>
  );
}
