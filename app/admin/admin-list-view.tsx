import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminPage } from "@/shared/admin-list";
import { adminPageHref } from "./admin-query";

const requestStatuses = [
  ["pending", "Pending"], ["reviewing", "Reviewing"], ["accepted", "Accepted"],
  ["rejected", "Rejected"], ["completed", "Completed"],
] as const;

export function AdminListView({ title, base, query, page, headers, rows, requestStatus = false }: {
  title: string; base: string; query: { q: string; status?: string };
  page: Pick<AdminPage<unknown>, "total" | "page" | "totalPages">;
  headers: string[]; rows: ReactNode; requestStatus?: boolean;
}) {
  return (
    <section aria-labelledby="list-heading">
      <h1 id="list-heading" className="text-3xl font-bold">{title}</h1>
      <form action={base} method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">Search
          <input name="q" defaultValue={query.q} maxLength={100} className="rounded border border-zinc-700 bg-zinc-900 p-2" />
        </label>
        {requestStatus && <label className="flex flex-col gap-1 text-sm">Status
          <select name="status" defaultValue={query.status ?? ""} className="rounded border border-zinc-700 bg-zinc-900 p-2">
            <option value="">All statuses</option>
            {requestStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>}
        <button className="rounded bg-indigo-600 px-4 py-2 hover:bg-indigo-500" type="submit">Apply filters</button>
        <Link href={base} className="p-2 text-sm underline">Clear</Link>
      </form>
      <p className="mt-5 text-sm text-zinc-400">{page.total} matching records</p>
      <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{title} matching the current filters</caption>
          <thead className="bg-zinc-900"><tr>{headers.map(header => <th key={header} scope="col" className="p-4">{header}</th>)}</tr></thead>
          <tbody className="divide-y divide-zinc-800">{rows}</tbody>
        </table>
      </div>
      <nav aria-label="Pagination" className="mt-6 flex items-center gap-5 text-sm">
        {page.page > 1 && <Link className="underline" href={adminPageHref(base, query, page.page - 1)}>Previous</Link>}
        <span>Page {page.page} of {Math.max(1, page.totalPages)}</span>
        {page.page < page.totalPages && <Link className="underline" href={adminPageHref(base, query, page.page + 1)}>Next</Link>}
        {page.page > Math.max(1, page.totalPages) && <Link className="underline" href={adminPageHref(base, query, 1)}>Return to first page</Link>}
      </nav>
    </section>
  );
}

export function EmptyAdminRow({ columns }: { columns: number }) {
  return <tr><td colSpan={columns} className="p-8 text-center text-zinc-400">No matching records on this page. Adjust the filters or return to the first page.</td></tr>;
}

export function adminDate(value?: Date): string {
  return value ? new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", dateStyle: "medium" }).format(value) : "Unknown";
}
