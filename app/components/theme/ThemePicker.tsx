"use client";

import {useEffect, useRef, useState} from "react";
import {PaintBrushIcon, CheckIcon} from "@heroicons/react/24/outline";

const STORAGE_KEY = "RomanizedMM_theme";
const DEFAULT_THEME = "royal-heritage";
const themes = [
  {id: "royal-heritage", name: "Royal Heritage", description: "Charcoal & antique gold", colors: ["#171613", "#24211E", "#DAA276"]},
  {id: "midnight-luxury", name: "Midnight Luxury", description: "Black & champagne gold", colors: ["#080808", "#24201A", "#D6AD60"]},
  {id: "cosmic", name: "Cosmic", description: "Midnight blue & violet", colors: ["#0B1026", "#1E2850", "#B5A5FF"]},
  {id: "vintage-vinyl", name: "Vintage Vinyl", description: "Espresso & warm amber", colors: ["#261B17", "#493126", "#E8A274"]},
] as const;

type ThemeId = typeof themes[number]["id"];

export default function ThemePicker() {
  const [selected, setSelected] = useState<ThemeId>(DEFAULT_THEME);
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (themes.some(theme => theme.id === current)) setSelected(current as ThemeId);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (theme: ThemeId) => {
    document.documentElement.dataset.theme = theme;
    setSelected(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* Theme still applies for this visit. */ }
    setOpen(false);
  };

  return (
    <div ref={container} className="relative">
      <button type="button" aria-label="Choose colour theme" aria-expanded={open} aria-controls="theme-picker-options"
        title="Appearance" onClick={() => setOpen(value => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-theme-border text-foreground hover:bg-surface-raised">
        <PaintBrushIcon className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <div id="theme-picker-options" role="group" aria-label="Appearance themes"
          className="absolute right-0 top-full z-[100] mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-theme-border bg-surface p-3 text-foreground shadow-2xl">
          <p className="mb-3 px-2 text-sm font-semibold">Choose your mood</p>
          <div className="flex flex-col gap-1">
            {themes.map(theme => (
              <button key={theme.id} type="button" aria-pressed={selected === theme.id}
                onClick={() => choose(theme.id)}
                className="flex min-h-14 w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-raised focus-visible:outline-offset-0">
                <span aria-hidden="true" className="flex shrink-0 overflow-hidden rounded-md border border-theme-border">
                  {theme.colors.map(color => <span key={color} className="h-8 w-4" style={{backgroundColor: color}} />)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{theme.name}</span>
                  <span className="block text-xs text-muted">{theme.description}</span>
                </span>
                {selected === theme.id && <CheckIcon className="h-5 w-5 shrink-0 text-accent" aria-label="Selected" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
