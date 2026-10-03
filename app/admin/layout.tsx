import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

import { requireAdmin } from "@/infrastructure/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
