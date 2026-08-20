import { MovieForm } from "../movie-form";

// No independent ADMIN check here — this page fetches no data of its own
// (the form starts blank), and createMovieAction() checks ADMIN
// independently before writing anything. See admin/customers/page.tsx and
// admin/movies/[id]/edit/page.tsx for pages that *do* need the check,
// because they run a real query on render.
export default function NewMoviePage() {
  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Add Movie</h1>
      <MovieForm mode="create" />
    </div>
  );
}
