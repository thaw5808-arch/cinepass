import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { FavoriteMoviesSection, FavoriteCinemasSection } from "./favorites-section";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnTo=%2Fprofile");
  }

  const [favoriteMovies, favoriteCinemas] = await Promise.all([
    prisma.favoriteMovie.findMany({
      where: { userId: user.id },
      include: { movie: { select: { slug: true, title: true, posterUrl: true } } },
      orderBy: { movie: { title: "asc" } },
    }),
    prisma.favoriteCinema.findMany({
      where: { userId: user.id },
      include: { cinema: { select: { name: true, address: true, city: true } } },
      orderBy: { cinema: { name: "asc" } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl tracking-wide mb-8">Profile</h1>

      <section className="mb-12">
        <h2 className="font-display text-2xl tracking-wide mb-5">Profile Information</h2>
        <ProfileForm
          defaultValues={{
            name: user.name,
            phone: user.phone ?? "",
            city: user.city ?? "",
            language: user.language,
          }}
        />
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl tracking-wide mb-5">Favorite Movies</h2>
        <FavoriteMoviesSection
          movies={favoriteMovies.map((f) => ({
            movieId: f.movieId,
            slug: f.movie.slug,
            title: f.movie.title,
            posterUrl: f.movie.posterUrl,
          }))}
        />
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl tracking-wide mb-5">Favorite Cinemas</h2>
        <FavoriteCinemasSection
          cinemas={favoriteCinemas.map((f) => ({
            cinemaId: f.cinemaId,
            name: f.cinema.name,
            address: f.cinema.address,
            city: f.cinema.city,
          }))}
        />
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl tracking-wide mb-5">Booking History</h2>
        <Link
          href="/my-tickets"
          className="flex items-center gap-2 w-fit rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-bg-elevated transition"
        >
          <Ticket className="h-4 w-4" />
          View My Tickets
        </Link>
      </section>

      <section>
        <h2 className="font-display text-2xl tracking-wide mb-5">Change Password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
