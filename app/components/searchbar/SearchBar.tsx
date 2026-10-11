"use client";
import React, { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import { useDebouncedCallback } from "use-debounce";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface OptionType {
  value: string;
  label: string;
  artistName: string;
}

const colourStyles = {
  control: (styles: any, state: any) => ({
    ...styles,
    backgroundColor: "var(--surface)",
    borderColor: state.isFocused ? "var(--accent)" : "var(--border)",
    borderWidth: "1px",
    minHeight: "56px",
    boxShadow: state.isFocused ? "0 0 0 2px var(--border)" : "none",
    borderRadius: "0.375rem",
    "&:hover": { borderColor: "var(--accent-hover)" },
  }),
  input: (styles: any) => ({ ...styles, color: "var(--foreground)" }),
  menu: (styles: any) => ({ ...styles, backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.375rem", overflow: "hidden", zIndex: 70 }),
  option: (styles: any, { isFocused, isSelected }: any) => ({
    ...styles, backgroundColor: isSelected || isFocused ? "var(--surface-raised)" : "var(--surface)",
    color: "var(--foreground)", cursor: "pointer", padding: "12px 14px",
  }),
  singleValue: (styles: any) => ({ ...styles, color: "var(--foreground)" }),
  placeholder: (styles: any) => ({ ...styles, color: "var(--muted)" }),
  clearIndicator: (styles: any) => ({ ...styles, color: "var(--muted)" }),
};

const SearchBar = ({showLabel = true}: {showLabel?: boolean}) => {
  const [mounted, setMounted] = useState(false);
  const [failed, setFailed] = useState(false);
  const params = useParams();
  const router = useRouter();
  const locale = typeof params.locale === "string" ? params.locale : "en";
  const translator = useTranslations("SearchBar");
  useEffect(() => setMounted(true), []);

  const loadOptions = useDebouncedCallback(async (input: string): Promise<OptionType[]> => {
    if (!input.trim()) return [];
    setFailed(false);
    try {
      const response = await fetch(`/api/song/search?query=${encodeURIComponent(input.trim())}`);
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      if (!data.success || !Array.isArray(data.songs)) throw new Error("Invalid search response");
      return data.songs.map((song: any) => ({
        value: String(song.mmid), label: song.songName,
        artistName: song.artistName?.[0]?.name || "Unknown Artist",
      }));
    } catch {
      setFailed(true);
      return [];
    }
  }, 300);

  const handleChange = (selection: OptionType | null) => {
    if (!selection) return;
    const slug = selection.label.split("(")[0].trim().replace(/\s/g, "");
    const option = localStorage.getItem("RomanizedMM_lyricsType") || "burmese";
    router.push(`/${locale}/song/${encodeURIComponent(slug)}/${selection.value}?option=${encodeURIComponent(option)}`);
  };

  return (
    <div className="w-full max-w-2xl px-4">
      <label className={`${showLabel ? "mb-2 block" : "sr-only"} text-left text-sm font-semibold text-foreground`} htmlFor="song-search">Find a song</label>
      {mounted ? (
        <AsyncSelect<OptionType>
          inputId="song-search"
          instanceId="song-search"
          cacheOptions
          loadOptions={loadOptions}
          placeholder={translator("search")}
          isClearable
          styles={colourStyles}
          noOptionsMessage={({ inputValue }) => failed ? "Search unavailable. Please try again." : inputValue ? "No matching songs found" : "Type a song or artist name"}
          loadingMessage={() => "Searching songs…"}
          components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
          formatOptionLabel={option => (
            <div><div className="font-semibold">{option.label}</div><div className="text-sm text-muted">{option.artistName}</div></div>
          )}
          onChange={handleChange}
        />
      ) : (
        <input id="song-search" type="search" disabled aria-label="Find a song" placeholder={translator("search")} className="h-14 w-full rounded-md border border-theme-border bg-surface px-4 text-foreground placeholder:text-muted" />
      )}
      {failed && <p role="status" className="mt-2 text-left text-sm text-accent-hover">Search is temporarily unavailable. Please retry.</p>}
    </div>
  );
};
export default SearchBar;
