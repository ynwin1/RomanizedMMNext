import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "@/app/components/navbar/menu/Menu";

export const Navbar = () => (
  <nav aria-label="Primary navigation" className="relative z-50 border-b border-[#38332E] bg-[#171613] text-[#F3EDE3]">
    <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-3 focus-visible:outline-offset-4" aria-label="RomanizedMM home">
        <Image src="/weblogo.png" alt="" width={42} height={42} className="rounded-full border border-[#5C4837]" />
        <span className="text-xl font-bold tracking-tight sm:text-[1.45rem]">RomanizedMM</span>
      </Link>
      <Menu />
    </div>
  </nav>
);
