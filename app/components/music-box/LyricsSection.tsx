"use client";
import React, {useEffect, useState} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useTranslations} from "next-intl";

interface LyricsSectionProps {
  romanized: string;
  burmese: string;
  meaning: string;
  selectedOption: string;
  hasTimestamps: boolean;
  syncAvailable?: boolean;
  syncEnabled?: boolean;
  onSyncToggle?: () => void;
  customRenderer: (lyrics: string) => React.ReactNode;
  onOptionChange: (option: string) => void;
}

const modes = ["romanized", "burmese", "meaning"] as const;
const FONT_MIN = 12;
const FONT_MAX = 32;
const LINE_MIN = 1.2;
const LINE_MAX = 2.6;
const DEFAULT_FONT = 16;
const DEFAULT_LINE = 1.9;
const SETTINGS_KEY = "RomanizedMM_lyricsReadingSettings";
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const fontSizeLabel = (size: number) => size <= 16 ? "Small" : size <= 20 ? "Comfortable" : size <= 25 ? "Large" : "Extra large";

const LyricsSection = ({romanized, burmese, meaning, selectedOption, hasTimestamps, syncAvailable, syncEnabled, onSyncToggle, customRenderer, onOptionChange}: LyricsSectionProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const {replace} = useRouter();
  const translator = useTranslations("MusicPage");
  const [fontSize, setFontSize] = useState(DEFAULT_FONT);
  const [lineSpacing, setLineSpacing] = useState(DEFAULT_LINE);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {fontSize?: unknown; lineSpacing?: unknown};
        if (typeof parsed.fontSize === "number" && Number.isFinite(parsed.fontSize)) {
          setFontSize(clamp(Math.round(parsed.fontSize), FONT_MIN, FONT_MAX));
        }
        if (typeof parsed.lineSpacing === "number" && Number.isFinite(parsed.lineSpacing)) {
          setLineSpacing(Math.round(clamp(parsed.lineSpacing, LINE_MIN, LINE_MAX) * 10) / 10);
        }
      }
    } catch {
      // Ignore unavailable or malformed browser preferences.
    }
    setSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({fontSize, lineSpacing}));
    } catch {
      // Reading controls still work when storage is unavailable.
    }
  }, [fontSize, lineSpacing, settingsLoaded]);

  useEffect(() => {
    const current = searchParams.get("option");
    if (current !== selectedOption) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("option", selectedOption);
      replace(`${pathname}?${params.toString()}`, {scroll: false});
    }
    localStorage.setItem("RomanizedMM_lyricsType", selectedOption);
  }, [selectedOption, replace, pathname, searchParams]);

  const chosenLyrics = selectedOption === "romanized" ? romanized : selectedOption === "burmese" ? burmese : meaning;

  return (
    <section aria-label={translator("lyrics")} className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-3 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Lyrics language" className="grid grid-cols-3 border-b border-theme-border">
          {modes.map(mode => (
            <button key={mode} type="button" aria-pressed={selectedOption === mode}
              onClick={() => onOptionChange(mode)}
              className={`min-h-11 border-b-2 px-2 py-3 text-sm font-semibold transition-colors sm:px-5 ${
                selectedOption === mode ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
              }`}>
              {translator(mode)}
            </button>
          ))}
        </div>
        <button type="button" aria-expanded={showSettings} aria-controls="lyrics-reading-settings"
          onClick={() => setShowSettings(open => !open)}
          className="min-h-11 self-end border-b border-accent px-2 text-sm font-medium text-foreground hover:text-accent">
          Reading settings
        </button>
      </div>
      {showSettings && (
        <div id="lyrics-reading-settings" role="group" aria-label="Reading settings"
          className="grid gap-5 border border-theme-border bg-surface p-4 sm:grid-cols-2">
          <label className="flex flex-col gap-3 text-sm text-foreground">
            <span className="flex justify-between gap-3"><span>Text size</span><output>{fontSizeLabel(fontSize)}</output></span>
            <input type="range" aria-label="Lyrics font size" min={FONT_MIN} max={FONT_MAX} step={1}
              value={fontSize} onChange={event => setFontSize(Number(event.target.value))}
              className="w-full accent-accent" />
            <span className="flex justify-between text-xs text-muted"><span>Smaller</span><span>Larger</span></span>
          </label>
          <label className="flex flex-col gap-3 text-sm text-foreground">
            <span className="flex justify-between gap-3"><span>Line spacing</span><output>{lineSpacing.toFixed(1)}×</output></span>
            <input type="range" aria-label="Lyrics line spacing" min={LINE_MIN} max={LINE_MAX} step={0.1}
              value={lineSpacing} onChange={event => setLineSpacing(Number(event.target.value))}
              className="w-full accent-accent" />
          </label>
          <button type="button" onClick={() => {setFontSize(DEFAULT_FONT); setLineSpacing(DEFAULT_LINE);}}
            className="min-h-11 justify-self-start border-b border-accent px-2 text-sm font-semibold text-foreground hover:text-accent">
            Reset to defaults
          </button>
        </div>
      )}
      {syncAvailable && <div className="flex justify-end">
        <button type="button" role="switch" aria-label="Sync lyrics" aria-checked={Boolean(syncEnabled)}
          onClick={onSyncToggle}
          className="inline-flex min-h-11 items-center gap-3 rounded-md px-2 text-sm text-foreground hover:bg-surface">
          <span>Sync lyrics</span>
          <span aria-hidden="true" className={`relative h-6 w-11 rounded-full transition-colors ${syncEnabled ? "bg-accent" : "bg-theme-border"}`}>
            <span className={`absolute left-0 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${syncEnabled ? "translate-x-6" : "translate-x-1"}`} />
          </span>
        </button>
      </div>}
      {hasTimestamps && <p className="text-center text-xs leading-relaxed text-muted">{translator("sync")}</p>}
      <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">{translator("lyrics")}</h2>
      <div className="min-w-0 whitespace-pre-wrap break-words border border-theme-border bg-surface px-4 py-6 text-left text-foreground sm:px-8 sm:py-8 sm:text-center"
        style={{fontSize: `${fontSize}px`, lineHeight: lineSpacing}}>
        {customRenderer(chosenLyrics)}
      </div>
    </section>
  );
};
export default LyricsSection;
