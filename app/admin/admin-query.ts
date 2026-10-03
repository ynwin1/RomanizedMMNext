import { AdminListQuerySchema } from "@/shared/admin-list";

export type AdminSearchParams = Record<string, string | string[] | undefined>;

export function parseAdminSearchParams(params: AdminSearchParams) {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const page = AdminListQuerySchema.shape.page.safeParse(first(params.page));
  const q = (first(params.q) ?? "").trim().slice(0, 100);
  const status = first(params.status);
  return {
    page: page.success ? page.data : 1,
    limit: 20,
    q,
    ...(status === "pending" || status === "added" ? { status } : {}),
  };
}

export function adminPageHref(base: string, query: { q: string; status?: string }, page: number) {
  const params = new URLSearchParams({ page: String(page) });
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  return base + "?" + params.toString();
}
