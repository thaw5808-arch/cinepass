import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const registerHref = returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : "/register";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl tracking-wide mb-2">Welcome back</h1>
      <p className="mb-8 text-sm text-text-muted">Sign in to manage your bookings and tickets.</p>

      <LoginForm returnTo={returnTo} />

      <p className="mt-6 text-center text-sm text-text-muted">
        New to CinePass?{" "}
        <Link href={registerHref} className="text-marquee-gold hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
