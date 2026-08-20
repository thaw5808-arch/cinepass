import { getCurrentUser } from "@/lib/session";
import { RoleHeader } from "@/components/layout/role-header";
import { AdminSidebar } from "./admin-sidebar";

/** Gates everything under /admin to ADMIN and wraps it in the dashboard sidebar shell. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-text-muted">
          The admin dashboard is restricted to administrators. Sign in with an admin account to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <RoleHeader label="Admin" user={user} />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <AdminSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
