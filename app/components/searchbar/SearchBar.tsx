"use client";
import React from 'react'
import Select from 'react-select'

const SearchBar = () => {
    // Temporary code for testing
    const options = [
        { value: 'chocolate', label: 'Chocolate' },
        { value: 'strawberry', label: 'Strawberry' },
        { value: 'vanilla', label: 'Vanilla' }
    ]


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
