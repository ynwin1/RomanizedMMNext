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
    backgroundColor: "#24211E",
    borderColor: state.isFocused ? "#DAA276" : "#6B5C4B",
    borderWidth: "1px",
    minHeight: "56px",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(218,162,118,.23)" : "none",
    borderRadius: "0.375rem",
    "&:hover": { borderColor: "#E8A572" },
  }),
  input: (styles: any) => ({ ...styles, color: "#F3EDE3" }),
  menu: (styles: any) => ({ ...styles, backgroundColor: "#24211E", border: "1px solid #6B5C4B", borderRadius: "0.375rem", overflow: "hidden", zIndex: 70 }),
  option: (styles: any, { isFocused, isSelected }: any) => ({
    ...styles, backgroundColor: isSelected ? "#68432D" : isFocused ? "#3A322B" : "#24211E",
    color: "#F3EDE3", cursor: "pointer", padding: "12px 14px",
  }),
  singleValue: (styles: any) => ({ ...styles, color: "#F3EDE3" }),
  placeholder: (styles: any) => ({ ...styles, color: "#CBBEAE" }),
  clearIndicator: (styles: any) => ({ ...styles, color: "#D0C5B6" }),
};

const SearchBar = () => {
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
      <label className="mb-2 block text-left text-sm font-semibold text-[#F3EDE3]" htmlFor="song-search">Find a song</label>
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
            <div><div className="font-semibold">{option.label}</div><div className="text-sm text-[#CBBEAE]">{option.artistName}</div></div>
          )}
          onChange={handleChange}
        />
      ) : (
        <input id="song-search" type="search" disabled aria-label="Find a song" placeholder={translator("search")} className="h-14 w-full rounded-md border border-[#6B5C4B] bg-[#24211E] px-4 text-[#F3EDE3] placeholder:text-[#CBBEAE]" />
      )}
      {failed && <p role="status" className="mt-2 text-left text-sm text-[#E8A572]">Search is temporarily unavailable. Please retry.</p>}
    </div>
  );
};
export default SearchBar;
