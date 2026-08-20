import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ScreenForm, type ScreenFormDefaults } from "../../screen-form";

export default async function EditScreenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Independent ADMIN check — this page runs real queries on render, same
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

  const [screen, cinemas] = await Promise.all([
    prisma.screen.findUnique({ where: { id } }),
    prisma.cinema.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!screen) notFound();

  const defaultValues: ScreenFormDefaults = {
    cinemaId: screen.cinemaId,
    name: screen.name,
    type: screen.type,
    capacity: screen.capacity,
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Edit Screen</h1>
      <ScreenForm mode="edit" screenId={screen.id} cinemas={cinemas} defaultValues={defaultValues} />
    </div>
  );
}
