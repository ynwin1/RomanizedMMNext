"use client";
import React, {useEffect, useState} from 'react'
import AsyncSelect from "react-select/async";
import {useDebouncedCallback} from "use-debounce";
import {redirect, useParams} from "next/navigation";
import {useTranslations} from "next-intl";

interface OptionType {
    value: string; // mmid
    label: string; // songName
}

const colourStyles = {
    control: (styles: any) => ({
        ...styles,
        backgroundColor: "white",
        borderColor: "#000000",
        borderWidth: "2px",
        width: '50vw',
        borderRadius: '0.5rem',
        '@media (max-width: 768px)': {
            width: '85vw',
        }
    }),
    option: (styles: any, { isFocused, isSelected }: any) => ({
        ...styles,
        backgroundColor: isFocused ? "#1f1f1f" : isSelected ? "#000000" : "#ffffff",
        color: isFocused || isSelected ? "white" : "black",
    }),
    singleValue: (styles: any) => ({
        ...styles,
        color: "white",
    }),
    placeholder: (styles: any) => ({
        ...styles,
        color: "gray",
    }),
};

const SearchBar = () => {
    const [mounted, setMounted] = useState(false);
    const params = useParams();
    const locale = params.locale;

    const translator = useTranslations("SearchBar");

    const loadOptions = useDebouncedCallback( async (inputValue: string): Promise<OptionType[]> => {
        if (!inputValue) {
            return [];
        }

        // API call to /api/song/search?query=${inputValue}
        const resp = await fetch(`/api/song/search?query=${inputValue}`);
        const data = await resp.json();

        if (data.success) {
            return data.songs.map((song: any) => ({
                value: song.mmid,
                label: song.songName,
            }));
        }

        return [];
    }, 300, { leading: true, trailing: true });

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const handleChange = (selectedOption: OptionType | null) => {
        if (!selectedOption) {
            return;
        }

        const { value, label } = selectedOption;
        // extract english song name
        const songName = label.split('(')[0].trim().replace(/\s/g, '');
        const optionType = localStorage.getItem("RomanizedMM_lyricsType") || 'romanized';
        const url = `/${locale}/song/${songName}/${value}?option=${optionType}`;
        // Navigate to the song page
        redirect(url);
    }

    return (
        <div>
            <AsyncSelect
                cacheOptions
                loadOptions={loadOptions}
                placeholder={translator("search")}
                isClearable
                styles={colourStyles}
                noOptionsMessage={() => "No songs found"}
                components={{ DropdownIndicator:() => null, IndicatorSeparator:() => null }}
                onChange={(selectedOption: OptionType | null) => handleChange(selectedOption)}
            />
        </div>
    )
}
export default SearchBar
