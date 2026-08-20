import { getCurrentUser } from "@/lib/session";
import { RoleHeader } from "@/components/layout/role-header";

/** Gates everything under /staff to STAFF/ADMIN and swaps the customer Navbar for a minimal shell — see RoleHeader. */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const authorized = !!user && (user.role === "STAFF" || user.role === "ADMIN");

  if (!authorized) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-text-muted">
          This area is restricted to cinema staff. Sign in with a staff or admin account to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <RoleHeader label="Staff" user={user} />
      <main>{children}</main>
    </div>
  );
}
