import type { Metadata } from "next";
import { lusitana } from "@/app/components/fonts/fonts";
import { Navbar } from "@/app/components/navbar/Navbar";
import "./globals.css";
import Footer from "@/app/components/footer/Footer";

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
        <Navbar />
        {children}
        <Footer />
    </body>
    </html>
  );
}
