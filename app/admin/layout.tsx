import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

import "@/app/globals.css";
import AdminSidebar from "./admin-sidebar";

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
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <ClerkProvider>
          <a href="#admin-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-zinc-900 focus:p-4">Skip to content</a>
          <div className="min-h-screen md:flex">
            <AdminSidebar />
            <main id="admin-content" tabIndex={-1} className="min-w-0 flex-1 p-6 md:p-10">
              <div className="mx-auto max-w-6xl">{children}</div>
            </main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
