export default function AdminSection({ title, description }: { title: string; description: string }) {
  return (
    <section aria-labelledby="section-heading">
      <h1 id="section-heading" className="text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-zinc-400">{description}</p>
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-8">
        <h2 className="text-lg font-semibold">This section is being prepared</h2>
        <p className="mt-2 text-sm text-zinc-400">Content lists and management tools will be available in an upcoming update.</p>
      </div>
    </section>
  );
}
