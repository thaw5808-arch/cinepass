import { CinemaForm } from "../cinema-form";

// No independent ADMIN check here — this page fetches no data of its own
// (the form starts blank), and createCinemaAction() checks ADMIN
// independently before writing anything. See admin/cinemas/page.tsx and
// admin/cinemas/[id]/edit/page.tsx for pages that *do* need the check,
// because they run a real query on render.
export default function NewCinemaPage() {
  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Add Cinema</h1>
      <CinemaForm mode="create" />
    </div>
  );
}
