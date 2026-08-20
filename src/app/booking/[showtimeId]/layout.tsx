import { notFound } from "next/navigation";
import { format } from "date-fns";
import { BookingProvider } from "@/lib/booking-context";
import { prisma } from "@/lib/prisma";

export default async function BookingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ showtimeId: string }>;
}) {
  const { showtimeId } = await params;

  const st = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: { movie: true, cinema: true, screen: true },
  });
  if (!st) notFound();

  const showtime = {
    showtimeId: st.id,
    movieTitle: st.movie.title,
    movieSlug: st.movie.slug,
    posterUrl: st.movie.posterUrl,
    cinemaName: st.cinema.name,
    screenName: `${st.screen.name} · ${st.format}`,
    showtimeLabel: format(st.startTime, "MMMM d '·' h:mm a"),
  };

  return (
    <BookingProvider showtime={showtime}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <BookingSteps />
        {children}
      </div>
    </BookingProvider>
  );
}

function BookingSteps() {
  const steps = ["Seats", "Food & Drinks", "Checkout", "Payment", "Confirmation"];
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className="font-mono">{i + 1}</span>
          <span>{s}</span>
          {i < steps.length - 1 && <span className="text-border">/</span>}
        </li>
      ))}
    </ol>
  );
}
