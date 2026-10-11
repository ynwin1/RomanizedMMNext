import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "@/app/components/navbar/menu/Menu";
import ThemePicker from "@/app/components/theme/ThemePicker";
import {getLocale} from "next-intl/server";

export const Navbar = async () => {
  const locale = await getLocale();
  return (
  <nav aria-label="Primary navigation" className="relative z-50 border-b border-theme-border-subtle bg-background text-foreground">
    <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
      <Link href={`/${locale}`} className="flex shrink-0 items-center gap-3 focus-visible:outline-offset-4" aria-label="RomanizedMM home">
        <Image src="/weblogo.png" alt="" width={42} height={42} className="rounded-full border border-theme-border" />
        <span className="hidden text-xl font-bold tracking-tight min-[390px]:inline sm:text-[1.45rem]">RomanizedMM</span>
      </Link>
      <div className="flex items-center gap-2"><Menu /><ThemePicker /></div>
    </div>
  </nav>
  );
};
