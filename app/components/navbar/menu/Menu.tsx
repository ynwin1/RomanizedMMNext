"use client";
import React, { useEffect, useRef, useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import LanguageSwitcher from "@/app/components/language-switch/LanguageSwitcher";
import { useLocale, useTranslations } from "next-intl";

export const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const locale = useLocale();
  const translator = useTranslations("Menu");
  const links = [
    { href: `/${locale}/song-catalogue?page=1&limit=10`, label: translator("catalogue") },
    { href: `/${locale}/artist-catalogue`, label: translator("artistCatalogue") },
    { href: `/${locale}/game-modes`, label: translator("gameModes") },
    { href: `/${locale}/song-request`, label: translator("songRequest") },
    { href: `/${locale}/about`, label: translator("about") },
  ];

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", keyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", keyDown);
      trigger.current?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <div className="hidden items-center gap-1 lg:flex">
        {links.map(link => (
          <Link key={link.href} href={link.href} className="border-b-2 border-transparent px-2 py-3 text-sm font-medium text-[#D0C5B6] transition-colors hover:border-[#D68D5E] hover:text-[#F3EDE3]">
            {link.label}
          </Link>
        ))}
        <div className="ml-4 border-l border-[#4B4036] pl-4"><LanguageSwitcher /></div>
      </div>
      <button ref={trigger} type="button" aria-label={isOpen ? "Close navigation" : "Open navigation"} aria-expanded={isOpen} aria-controls="mobile-navigation" className="flex h-11 w-11 items-center justify-center border border-[#615344] hover:bg-[#29241F] lg:hidden" onClick={() => setIsOpen(v => !v)}>
        {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </button>
      {isOpen && (
        <div id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Site navigation" className="fixed inset-0 z-[90] flex min-h-[100dvh] flex-col bg-[#171613] px-6 py-5 text-white lg:hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <span className="text-xl font-bold">RomanizedMM</span>
            <button ref={closeButton} type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation" className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20"><XMarkIcon className="h-6 w-6" /></button>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-2">
            <Link href={`/${locale}`} onClick={() => setIsOpen(false)} className="border-b border-[#38332E] px-2 py-4 text-lg font-medium hover:text-[#E8A572]">Home</Link>
            {links.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="border-b border-[#38332E] px-2 py-4 text-lg font-medium hover:text-[#E8A572]">{link.label}</Link>
            ))}
          </div>
          <div className="border-t border-[#38332E] py-5"><LanguageSwitcher /></div>
        </div>
      )}
    </>
  );
};
