import type { AuthPrincipal } from "./auth.types";

export function isAdminPrincipal(
  principal: AuthPrincipal | null,
): principal is AuthPrincipal & { role: "admin" } {
  return principal?.role === "admin";
}
