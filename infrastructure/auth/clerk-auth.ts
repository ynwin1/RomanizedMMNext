import { auth, currentUser } from "@clerk/nextjs/server";

import type { AuthPrincipal } from "./auth.types";

export async function getCurrentPrincipal(): Promise<AuthPrincipal | null> {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return null;
  }

  const user = await currentUser();

  if (!user) {
    return null;
  }

  const role = user.publicMetadata?.role === "admin" ? "admin" : null;

  return {
    userId,
    role,
  };
}

export async function redirectToAdminSignIn(): Promise<void> {
  const { redirectToSignIn } = await auth();

  await redirectToSignIn({
    returnBackUrl: "/admin",
  });
}
