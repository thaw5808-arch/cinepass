import Link from "next/link";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const loginHref = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl tracking-wide mb-2">Create your account</h1>
      <p className="mb-8 text-sm text-text-muted">Book seats, order food ahead, and keep every ticket in one place.</p>

      <RegisterForm returnTo={returnTo} />

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="text-marquee-gold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
