/** Shared stub for admin sections that don't have a real screen yet — keeps the sidebar's links all real (routable) instead of dead. */
export function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">{title}</h1>
      <p className="text-sm text-text-muted">This section isn&apos;t built yet — check back soon.</p>
    </div>
  );
}
