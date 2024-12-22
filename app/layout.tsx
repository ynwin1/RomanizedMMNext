import type { Metadata } from "next";
import { lusitana } from "@/app/components/fonts/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "RomanizedMM",
  description: "Spreading Burmese music to the World",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
      <body className={`${lusitana.className} antialiased`}>
      {children}
      </body>
      </html>
  );
}
