import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { CinemaForm, type CinemaFormDefaults } from "../../cinema-form";

export default async function EditCinemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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

  const cinema = await prisma.cinema.findUnique({ where: { id } });
  if (!cinema) notFound();

  const defaultValues: CinemaFormDefaults = {
    name: cinema.name,
    address: cinema.address,
    city: cinema.city,
    latitude: cinema.latitude,
    longitude: cinema.longitude,
    formats: cinema.formats.join(", "),
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Edit Cinema</h1>
      <CinemaForm mode="edit" cinemaId={cinema.id} defaultValues={defaultValues} />
    </div>
  );
}
