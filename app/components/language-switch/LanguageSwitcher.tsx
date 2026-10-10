"use client";
import React from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Deliberately secondary to discovery navigation: a compact language control. */
const LanguageSwitcher = () => {
  const locale = useLocale();
  const { replace } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const switchLanguage = (lang: string) => {
    if (lang === locale) return;
    const segments = pathname.split("/").filter(Boolean);
    segments[0] = lang;
    const query = searchParams.toString();
    replace(`/${segments.join("/")}${query ? `?${query}` : ""}`, { scroll: false });
  };

  return (
    <div className="inline-flex items-center gap-2 text-xs tracking-wide text-[#D0C5B6]">
      <label htmlFor="site-language" className="sr-only">Site language</label>
      <select
        id="site-language"
        aria-label="Site language"
        value={locale}
        onChange={event => switchLanguage(event.target.value)}
        className="h-10 min-w-[76px] cursor-pointer border-b border-[#766758] bg-[#171613] px-2 text-sm font-medium text-[#F3EDE3] hover:border-[#E8A572] focus-visible:outline-offset-2"
      >
        <option value="en">EN</option>
        <option value="my">မြန်မာ</option>
      </select>
    </div>
  );
};
export default LanguageSwitcher;
