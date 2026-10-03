import { z } from "zod";
import { AdminListQuerySchema } from "@/shared/admin-list";
export const AdminRequestQuerySchema = AdminListQuerySchema.extend({
  status: z.enum(["pending", "added"]).optional(),
});
export type AdminRequestQuery = z.infer<typeof AdminRequestQuerySchema>;
