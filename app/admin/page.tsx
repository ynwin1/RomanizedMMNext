import Link from "next/link";
import { adminNavigation } from "./admin-navigation";

export default function AdminPage() {
  return (
    <section aria-labelledby="overview-heading">
      <p className="text-sm font-medium text-indigo-300">Admin access is active.</p>
      <h1 id="overview-heading" className="mt-2 text-3xl font-bold">Overview</h1>
      <p className="mt-3 text-zinc-400">Choose a section to manage RomanizedMM content.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {adminNavigation.filter(({ href }) => href !== "/admin").map(({ href, label, description }) => (
          <Link key={href} href={href} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400">
            <h2 className="text-xl font-semibold">{label}</h2>
            <p className="mt-2 text-sm text-zinc-400">{description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
