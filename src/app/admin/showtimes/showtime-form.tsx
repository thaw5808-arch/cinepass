"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  createShowtimeAction,
  updateShowtimeAction,
  type ShowtimeFormState,
} from "@/lib/actions/showtimes";

export type ShowtimeFormDefaults = {
  format: string;
  language: string;
  subtitle: string;
  basePrice: number | "";
};

type ShowtimeFormProps =
  | {
      mode: "create";
      movies: { id: string; title: string; durationMins: number }[];
      cinemas: { id: string; name: string }[];
      screens: { id: string; name: string; cinemaId: string }[];
    }
  | {
      mode: "edit";
      showtimeId: string;
      context: { movieTitle: string; cinemaName: string; screenName: string; dateTimeLabel: string };
      defaultValues: ShowtimeFormDefaults;
    };

export function ShowtimeForm(props: ShowtimeFormProps) {
  const action = props.mode === "create" ? createShowtimeAction : updateShowtimeAction;
  const [state, formAction, pending] = useActionState<ShowtimeFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {props.mode === "create" ? (
        <CreateFields movies={props.movies} cinemas={props.cinemas} screens={props.screens} state={state} />
      ) : (
        <EditFields
          showtimeId={props.showtimeId}
          context={props.context}
          defaultValues={props.defaultValues}
          state={state}
        />
      )}

      {state?.message && <p className="text-sm text-velvet-red-bright">{state.message}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-marquee-gold px-5 py-2.5 text-sm font-semibold text-bg hover:brightness-110 transition disabled:opacity-60"
        >
          {pending ? "Saving…" : props.mode === "create" ? "Add Showtime" : "Save Changes"}
        </button>
        <Link
          href="/admin/showtimes"
          className="rounded-md border border-border px-5 py-2.5 text-sm hover:bg-bg-elevated transition"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function CreateFields({
  movies,
  cinemas,
  screens,
  state,
}: {
  movies: { id: string; title: string; durationMins: number }[];
  cinemas: { id: string; name: string }[];
  screens: { id: string; name: string; cinemaId: string }[];
  state: ShowtimeFormState;
}) {
  const [movieId, setMovieId] = useState("");
  const [cinemaId, setCinemaId] = useState("");
  const [startTime, setStartTime] = useState("");

  const screensForCinema = useMemo(
    () => screens.filter((s) => s.cinemaId === cinemaId),
    [screens, cinemaId]
  );

  const endTimeLabel = useMemo(() => {
    if (!movieId || !startTime) return null;
    const movie = movies.find((m) => m.id === movieId);
    const start = new Date(startTime);
    if (!movie || Number.isNaN(start.getTime())) return null;
    const end = new Date(start.getTime() + movie.durationMins * 60 * 1000);
    return end.toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });
  }, [movieId, startTime, movies]);

  return (
    <>
      <Field label="Movie" htmlFor="movieId" errors={state?.errors?.movieId}>
        {movies.length === 0 ? (
          <EmptyHint href="/admin/movies/new" label="add one first" />
        ) : (
          <select
            id="movieId"
            name="movieId"
            value={movieId}
            onChange={(e) => setMovieId(e.target.value)}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Choose a movie
            </option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cinema" htmlFor="cinemaId" errors={state?.errors?.cinemaId}>
          {cinemas.length === 0 ? (
            <EmptyHint href="/admin/cinemas/new" label="add one first" />
          ) : (
            <select
              id="cinemaId"
              name="cinemaId"
              value={cinemaId}
              onChange={(e) => setCinemaId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="" disabled>
                Choose a cinema
              </option>
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Screen" htmlFor="screenId" errors={state?.errors?.screenId}>
          {!cinemaId ? (
            <p className="flex h-[42px] items-center text-sm text-text-muted">Choose a cinema first</p>
          ) : screensForCinema.length === 0 ? (
            <EmptyHint href="/admin/screens/new" label="add one first" />
          ) : (
            <select id="screenId" name="screenId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                Choose a screen
              </option>
              {screensForCinema.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field
        label="Date & Time"
        htmlFor="startTime"
        hint={endTimeLabel ? `Ends around ${endTimeLabel}, based on the movie's runtime` : undefined}
        errors={state?.errors?.startTime}
      >
        <input
          id="startTime"
          name="startTime"
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Format" htmlFor="format" hint="e.g. 2D, IMAX, 4DX" errors={state?.errors?.format}>
          <input id="format" name="format" placeholder="2D" required className={inputClass} />
        </Field>

        <Field label="Language" htmlFor="language" errors={state?.errors?.language}>
          <input id="language" name="language" required className={inputClass} />
        </Field>
      </div>

      <Field label="Subtitle" htmlFor="subtitle" hint="Optional" errors={state?.errors?.subtitle}>
        <input id="subtitle" name="subtitle" className={inputClass} />
      </Field>

      <Field label="Base Price (฿)" htmlFor="basePrice" errors={state?.errors?.basePrice}>
        <input
          id="basePrice"
          name="basePrice"
          type="number"
          min={1}
          step="0.01"
          required
          className={inputClass}
        />
      </Field>
    </>
  );
}

function EditFields({
  showtimeId,
  context,
  defaultValues,
  state,
}: {
  showtimeId: string;
  context: { movieTitle: string; cinemaName: string; screenName: string; dateTimeLabel: string };
  defaultValues: ShowtimeFormDefaults;
  state: ShowtimeFormState;
}) {
  return (
    <>
      <input type="hidden" name="showtimeId" value={showtimeId} />

      <div className="rounded-lg border border-border bg-bg-elevated p-4 text-sm space-y-1">
        <p className="text-xs uppercase tracking-wide text-text-muted mb-1">
          Movie, screen, and time can&apos;t be changed here
        </p>
        <p className="text-text-primary">{context.movieTitle}</p>
        <p className="text-text-muted">
          {context.cinemaName} · {context.screenName}
        </p>
        <p className="text-text-muted font-mono">{context.dateTimeLabel}</p>
        <p className="pt-1 text-xs text-text-muted">
          Changing any of these would mean regenerating seat inventory — delete this showtime and create a
          new one instead.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Format" htmlFor="format" errors={state?.errors?.format}>
          <input id="format" name="format" defaultValue={defaultValues.format} required className={inputClass} />
        </Field>

        <Field label="Language" htmlFor="language" errors={state?.errors?.language}>
          <input
            id="language"
            name="language"
            defaultValue={defaultValues.language}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Subtitle" htmlFor="subtitle" hint="Optional" errors={state?.errors?.subtitle}>
        <input id="subtitle" name="subtitle" defaultValue={defaultValues.subtitle} className={inputClass} />
      </Field>

      <Field
        label="Base Price (฿)"
        htmlFor="basePrice"
        hint="Updates every seat's price for this showtime — VIP/Premium/Couple keep their markup over this base"
        errors={state?.errors?.basePrice}
      >
        <input
          id="basePrice"
          name="basePrice"
          type="number"
          min={1}
          step="0.01"
          defaultValue={defaultValues.basePrice}
          required
          className={inputClass}
        />
      </Field>
    </>
  );
}

function EmptyHint({ href, label }: { href: string; label: string }) {
  return (
    <p className="text-sm text-text-muted">
      None yet —{" "}
      <Link href={href} className="text-marquee-gold hover:underline">
        {label}
      </Link>
      .
    </p>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-marquee-gold-dim";

function Field({
  label,
  htmlFor,
  hint,
  errors,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-text-primary mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
      {errors?.map((e) => (
        <p key={e} className="mt-1.5 text-xs text-velvet-red-bright">
          {e}
        </p>
      ))}
    </div>
  );
}
