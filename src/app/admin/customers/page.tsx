import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { CustomersTable } from "./customers-table";

export default async function AdminCustomersPage() {
  // Independent ADMIN check — defense-in-depth, not a redundant copy of
  // the layout's gate. Next.js client-side transitions keep the layout
  // (and its RoleHeader) mounted across sibling /admin/* navigations and
  // only replace the page segment — see "Client-side transitions" in the
  // Next.js docs. That means src/app/admin/layout.tsx's getCurrentUser()
  // call, and the header it renders, are NOT guaranteed to re-run on every
  // navigation into this page; only this page's own render is guaranteed
  // fresh per navigation. Resolving the current user again, right here,
  // is what keeps both the user list query and the "You" badge below tied
  // to *this* request's real session rather than whatever the layout last
  // happened to render.
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

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    joined: format(u.createdAt, "MMM d, yyyy"),
  }));

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Customers</h1>
      <CustomersTable users={rows} currentUserId={currentUser.id} />
    </div>
  );
}
