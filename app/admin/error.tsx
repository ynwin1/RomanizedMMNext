"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section role="alert" className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
      <h1 className="text-xl font-semibold">Unable to load this section</h1>
      <p className="mt-2 text-zinc-400">Please try again.</p>
      <button type="button" onClick={reset} className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-300">Try again</button>
    </section>
  );
}
