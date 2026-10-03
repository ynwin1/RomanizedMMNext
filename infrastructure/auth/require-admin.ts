import { redirect } from "next/navigation";

import { isAdminPrincipal } from "./authorization";
import { getCurrentPrincipal, redirectToAdminSignIn } from "./clerk-auth";
import type { AuthPrincipal } from "./auth.types";

type AdminPrincipal = AuthPrincipal & { role: "admin" };

export function createRequireAdmin(dependencies: {
  getPrincipal: () => Promise<AuthPrincipal | null>;
  redirectToSignIn: () => Promise<void>;
  redirect: (path: string) => never;
}) {
  return async function requireAdmin(): Promise<AdminPrincipal> {
    const principal = await dependencies.getPrincipal();

    if (!principal) {
      await dependencies.redirectToSignIn();
      dependencies.redirect("/");
    }

    if (!isAdminPrincipal(principal)) {
      dependencies.redirect("/");
    }

    return principal;
  };
}

export const requireAdmin = createRequireAdmin({
  getPrincipal: getCurrentPrincipal,
  redirectToSignIn: redirectToAdminSignIn,
  redirect,
});
