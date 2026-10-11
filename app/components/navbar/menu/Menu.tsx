"use client";
import React, { useEffect, useRef, useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import LanguageSwitcher from "@/app/components/language-switch/LanguageSwitcher";
import { useLocale, useTranslations } from "next-intl";
import {usePathname} from "next/navigation";

export const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const pathname = usePathname();
  const translator = useTranslations("Menu");
  const links = [
    { href: `/${locale}/song-catalogue?page=1&limit=10`, label: translator("catalogue") },
    { href: `/${locale}/artist-catalogue`, label: translator("artistCatalogue") },
    { href: `/${locale}/playlists`, label: translator("playlists") },
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
      } else if (event.key === "Tab") {
        const focusable = dialog.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), select:not([disabled])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
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
          <Link key={link.href} href={link.href} aria-current={pathname === link.href.split("?")[0] ? "page" : undefined} className="border-b-2 border-transparent px-2 py-3 text-sm font-medium text-muted transition-colors hover:border-accent-hover hover:text-foreground aria-[current=page]:border-accent aria-[current=page]:text-foreground">
            {link.label}
          </Link>
        ))}
        <div className="ml-4 border-l border-theme-border pl-4"><LanguageSwitcher /></div>
      </div>
      <button ref={trigger} type="button" aria-label={isOpen ? "Close navigation" : "Open navigation"} aria-expanded={isOpen} aria-controls="mobile-navigation" className="flex h-11 w-11 items-center justify-center border border-theme-border hover:bg-surface-raised lg:hidden" onClick={() => setIsOpen(v => !v)}>
        {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </button>
      {isOpen && (
        <div ref={dialog} id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Site navigation" className="fixed inset-0 z-[90] flex h-[100dvh] flex-col overflow-y-auto bg-background px-6 py-5 text-foreground lg:hidden">
          <div className="flex items-center justify-between border-b border-theme-border-subtle pb-5">
            <span className="text-xl font-bold">RomanizedMM</span>
            <button ref={closeButton} type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation" className="flex h-11 w-11 items-center justify-center rounded-xl border border-theme-border"><XMarkIcon className="h-6 w-6" /></button>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-2">
            <Link href={`/${locale}`} onClick={() => setIsOpen(false)} aria-current={pathname === `/${locale}` ? "page" : undefined} className="border-b border-theme-border-subtle px-2 py-4 text-lg font-medium hover:text-accent-hover aria-[current=page]:text-accent">{translator("home")}</Link>
            {links.map(link => (
              <Link key={link.href} href={link.href} aria-current={pathname === link.href.split("?")[0] ? "page" : undefined} onClick={() => setIsOpen(false)} className="border-b border-theme-border-subtle px-2 py-4 text-lg font-medium hover:text-accent-hover aria-[current=page]:text-accent">{link.label}</Link>
            ))}
          </div>
          <div className="border-t border-theme-border-subtle py-5"><LanguageSwitcher /></div>
        </div>
      )}
    </>
  );
};
