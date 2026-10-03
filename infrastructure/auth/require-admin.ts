import { redirect } from "next/navigation";

import { isAdminPrincipal } from "./authorization";
import { getCurrentPrincipal, redirectToAdminSignIn } from "./clerk-auth";
import type { AuthPrincipal } from "./auth.types";

export async function requireAdmin(): Promise<AuthPrincipal & { role: "admin" }> {
  const principal = await getCurrentPrincipal();

  if (!principal) {
    await redirectToAdminSignIn();
    redirect("/");
  }

  if (!isAdminPrincipal(principal)) {
    redirect("/");
  }

  return principal;
}
