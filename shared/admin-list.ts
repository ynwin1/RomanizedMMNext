import { z } from "zod";

export const AdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).default(""),
});
export type AdminListQuery = z.infer<typeof AdminListQuerySchema>;
export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export function adminPage<T>(items: T[], total: number, query: AdminListQuery): AdminPage<T> {
  return { items, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
}
