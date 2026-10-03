export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading admin content…</span>
      <div aria-hidden="true" className="h-9 w-48 animate-pulse rounded bg-zinc-800" />
      <div aria-hidden="true" className="h-40 animate-pulse rounded-xl bg-zinc-900" />
    </div>
  );
}
