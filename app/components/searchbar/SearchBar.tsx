"use client";
import React, {useEffect, useState} from 'react'
import AsyncSelect from "react-select/async";
import {useDebouncedCallback} from "use-debounce";
import { redirect } from "next/navigation";

interface OptionType {
    value: string; // mmid
    label: string; // songName
}

const colourStyles = {
    control: (styles: any) => ({
        ...styles,
        backgroundColor: "white",
        borderColor: "#ffffff",
        borderWidth: "1px",
        width: '50vw',
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

    const loadOptions = useDebouncedCallback( async (inputValue: string): Promise<OptionType[]> => {
        if (!inputValue) {
            return [];
        }

        // API call to /api/song/search?query=${inputValue}
        const resp = await fetch(`/api/song/search?query=${inputValue}`);
        const data = await resp.json();

        if (data.success) {
            return data.data.map((song: any) => ({
                value: song.mmid,
                label: song.songName,
            }));
        }

        return [];
    }, 200);

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
        // TODO: set lang and option based on user's preference
        const optionType = localStorage.getItem("RomanizedMM_lyricsType") || 'romanized';
        const url = `/song/${songName}/${value}?lang=en&option=${optionType}`;
        // Navigate to the song page
        redirect(url);
    }

    return (
        <div>
            <AsyncSelect
                cacheOptions
                loadOptions={loadOptions}
                placeholder={"Type a song title..."}
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
