"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MovieStatus } from "@prisma/client";
import { createMovieAction, updateMovieAction, type MovieFormState } from "@/lib/actions/movies";

const STATUS_LABEL: Record<MovieStatus, string> = {
  COMING_SOON: "Coming Soon",
  NOW_SHOWING: "Now Showing",
  ENDED: "Ended",
};

export type MovieFormDefaults = {
  title: string;
  synopsis: string;
  genres: string; // comma-separated, e.g. "Sci-Fi, Adventure"
  durationMins: number | "";
  rating: number | "";
  ageRating: string;
  language: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string; // YYYY-MM-DD
  status: MovieStatus;
};

const BLANK_DEFAULTS: MovieFormDefaults = {
  title: "",
  synopsis: "",
  genres: "",
  durationMins: "",
  rating: 0,
  ageRating: "",
  language: "",
  posterUrl: "",
  backdropUrl: "",
  releaseDate: "",
  status: "COMING_SOON",
};

export function MovieForm({
  mode,
  movieId,
  defaultValues,
}: {
  mode: "create" | "edit";
  movieId?: string;
  defaultValues?: MovieFormDefaults;
}) {
  const action = mode === "create" ? createMovieAction : updateMovieAction;
  const [state, formAction, pending] = useActionState<MovieFormState, FormData>(action, undefined);
  const values = defaultValues ?? BLANK_DEFAULTS;

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {mode === "edit" && movieId && <input type="hidden" name="movieId" value={movieId} />}

      <Field label="Title" htmlFor="title" errors={state?.errors?.title}>
        <input
          id="title"
          name="title"
          defaultValue={values.title}
          required
          className={inputClass}
        />
      </Field>

      <Field label="Synopsis" htmlFor="synopsis" errors={state?.errors?.synopsis}>
        <textarea
          id="synopsis"
          name="synopsis"
          rows={3}
          defaultValue={values.synopsis}
          required
          className={inputClass}
        />
      </Field>

      <Field
        label="Genres"
        htmlFor="genres"
        hint="Comma-separated, e.g. Sci-Fi, Adventure"
        errors={state?.errors?.genres}
      >
        <input id="genres" name="genres" defaultValue={values.genres} required className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Duration (minutes)" htmlFor="durationMins" errors={state?.errors?.durationMins}>
          <input
            id="durationMins"
            name="durationMins"
            type="number"
            min={1}
            defaultValue={values.durationMins}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Rating (0–10)" htmlFor="rating" errors={state?.errors?.rating}>
          <input
            id="rating"
            name="rating"
            type="number"
            min={0}
            max={10}
            step={0.1}
            defaultValue={values.rating}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Age Rating" htmlFor="ageRating" errors={state?.errors?.ageRating}>
          <input
            id="ageRating"
            name="ageRating"
            placeholder="PG-13"
            defaultValue={values.ageRating}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Language" htmlFor="language" errors={state?.errors?.language}>
          <input id="language" name="language" defaultValue={values.language} required className={inputClass} />
        </Field>
      </div>

      <Field
        label="Poster Image URL"
        htmlFor="posterUrl"
        hint="Must be on a domain allowed by next.config.ts (images.unsplash.com works out of the box)"
        errors={state?.errors?.posterUrl}
      >
        <input
          id="posterUrl"
          name="posterUrl"
          type="url"
          defaultValue={values.posterUrl}
          required
          className={inputClass}
        />
      </Field>

      <Field label="Backdrop Image URL" htmlFor="backdropUrl" errors={state?.errors?.backdropUrl}>
        <input
          id="backdropUrl"
          name="backdropUrl"
          type="url"
          defaultValue={values.backdropUrl}
          required
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Release Date" htmlFor="releaseDate" errors={state?.errors?.releaseDate}>
          <input
            id="releaseDate"
            name="releaseDate"
            type="date"
            defaultValue={values.releaseDate}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Status" htmlFor="status" errors={state?.errors?.status}>
          <select id="status" name="status" defaultValue={values.status} className={inputClass}>
            {Object.values(MovieStatus).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {state?.message && <p className="text-sm text-velvet-red-bright">{state.message}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-marquee-gold px-5 py-2.5 text-sm font-semibold text-bg hover:brightness-110 transition disabled:opacity-60"
        >
          {pending ? "Saving…" : mode === "create" ? "Add Movie" : "Save Changes"}
        </button>
        <Link
          href="/admin/movies"
          className="rounded-md border border-border px-5 py-2.5 text-sm hover:bg-bg-elevated transition"
        >
          Cancel
        </Link>
      </div>
    </form>
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
