"use client"
import React, { useState } from 'react';
import { useDebouncedCallback } from "use-debounce";
import { Category } from "@/app/(pages)/[locale]/(admin)/admin/dashboard/page";
import { IArtist } from "@/app/model/Artist";
import { ISong } from "@/app/model/Song";

interface DynamicSearchBarProps {
    category: Category.SONG | Category.ARTIST;
    onSelect: (option: ISong | IArtist) => void; // Single item instead of array
    placeholder?: string;
    selectedItem?: ISong | IArtist | null;
    onClear?: () => void;
}

const DynamicSearchBar: React.FC<DynamicSearchBarProps> = ({
                                                               category,
                                                               onSelect,
                                                               placeholder,
                                                               selectedItem,
                                                               onClear
                                                           }) => {
    const [options, setOptions] = useState<(ISong | IArtist)[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const fetchOptions = useDebouncedCallback(async (query: string) => {
        if (!query.trim()) {
            setOptions([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            const endpoint = category === Category.SONG
                ? `/api/song/search?query=${query}`
                : `/api/artist/search?query=${query}`;

            console.log(`Fetching from: ${endpoint}`);
            const response = await fetch(endpoint);

            if (!response.ok) {
                console.log(`Error response: ${response.status} - ${response.statusText}`);
                throw new Error(`Search failed: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && Array.isArray(data.songs)) {
                setOptions(data.songs);
                setIsOpen(data.songs.length > 0);
            } else {
                setOptions([]);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Error fetching options:', error);
            setOptions([]);
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    }, 300);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        fetchOptions(value);
    };

    const handleOptionSelect = (option: ISong | IArtist) => {
        onSelect(option);
        setSearchTerm('');
        setOptions([]);
        setIsOpen(false);
    };

    const handleClear = () => {
        setSearchTerm('');
        setOptions([]);
        setIsOpen(false);
        onClear?.();
    };

    // Helper to get display name based on type
    const getDisplayName = (item: ISong | IArtist): string => {
        if ('slug' in item) {
            // It's an artist
            return item.name || 'Unknown Artist';
        } else {
            // It's a song
            return `${item.songName}` || 'Unknown Song';
        }
    };

    // Helper to get unique key
    const getItemKey = (item: ISong | IArtist): string => {
        return item._id || item.id || Math.random().toString();
    };

    return (
        <div className="relative">
            {/* Show selected item if exists */}
            {selectedItem && !searchTerm && (
                <div className="flex items-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="flex-1 text-sm">
                        {getDisplayName(selectedItem)}
                    </span>
                    <button
                        onClick={handleClear}
                        className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                        type="button"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Search input - only show if no selection or user is searching */}
            {(!selectedItem || searchTerm) && (
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    placeholder={placeholder || `Search ${category.toLowerCase()}s...`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    onFocus={() => {
                        if (searchTerm && options.length > 0) {
                            setIsOpen(true);
                        }
                    }}
                    onBlur={() => {
                        // Delay to allow click on option
                        setTimeout(() => setIsOpen(false), 200);
                    }}
                />
            )}

            {/* Options dropdown */}
            {isOpen && options.length > 0 && (
                <ul className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-lg shadow-md mt-1 z-10 max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <li
                            key={getItemKey(option)}
                            onClick={() => handleOptionSelect(option)}
                            className="px-4 py-2 text-black hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                            <div className="text-sm font-medium">
                                {getDisplayName(option)}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* No results message */}
            {!loading && searchTerm && options.length === 0 && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-lg shadow-md mt-1 p-4 text-sm text-gray-500 text-center">
                    No {category.toLowerCase()}s found
                </div>
            )}
        </div>
    );
};

export default DynamicSearchBar;