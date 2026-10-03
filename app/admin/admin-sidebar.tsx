"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation, isAdminRouteActive } from "./admin-navigation";

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-zinc-800 bg-zinc-950 p-6 md:min-h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <Link href="/admin" className="text-lg font-bold tracking-tight">RomanizedMM Admin</Link>
      <p className="mt-1 text-sm text-zinc-400">Content workspace</p>
      <nav aria-label="Admin navigation" className="mt-6 flex flex-wrap gap-2 md:flex-col">
        {adminNavigation.map(({ href, label }) => {
          const active = isAdminRouteActive(pathname, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={active
                ? "rounded-lg bg-indigo-500/20 px-4 py-3 font-medium text-indigo-200"
                : "rounded-lg px-4 py-3 text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"}>
              {label}
            </Link>
          );
        })}
      </nav>
      <Link href="/" className="mt-8 inline-block text-sm text-zinc-400 underline hover:text-white">View public site</Link>
    </aside>
  );
}
