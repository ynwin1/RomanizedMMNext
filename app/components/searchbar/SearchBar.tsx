"use client";
import React, {useEffect, useState} from 'react'
import dynamic from "next/dynamic";

const Select = dynamic(() => import('react-select'), {
    ssr: false
});

const SearchBar = () => {
    // Temporary code for testing
    const options = [
        { value: 'chocolate', label: 'Chocolate' },
        { value: 'strawberry', label: 'Strawberry' },
        { value: 'vanilla', label: 'Vanilla' }
    ]

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div style={{
            minWidth: "10rem",
            maxWidth: "40rem",
            width: "80%",
        }}>
            <Select
                options={options}
                placeholder={"Type a song title..."}
                isClearable
                menuPlacement="auto"
                menuPosition="fixed"
                styles={{
                    placeholder: (base) => ({
                        ...base,
                        color: "black",
                    }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? "#3182ce" : state.isFocused ? "#63b3ed" : "#ebf4ff",
                        color: state.isSelected ? "white" : "black",
                    }),
                }}
            />
        </div>
    )
}
export default SearchBar
