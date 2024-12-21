"use client";
import React, {useState} from 'react'
import {XMarkIcon, HomeIcon, Bars3Icon} from "@heroicons/react/24/outline"; // Heroicons for icons
import Link from "next/link";

export const Menu = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <button className="w-8 cursor-pointer hover:text-blue-300 hover:rounded" onClick={() => setIsOpen(!isOpen)}>
                <Bars3Icon className="w-8 cursor-pointer hover:text-blue-300" />
            </button>
            {isOpen && <MenuOverlay close={setIsOpen}/>}
        </div>
    )
}

const MenuOverlay = ({ close }: { close: React.Dispatch<React.SetStateAction<boolean>> }) => {
    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-100 flex flex-col justify-evenly items-center">
            <button className="absolute top-4 right-4" onClick={() => close(false)}>
                <XMarkIcon className="w-8" />
            </button>
            <div className="flex flex-col justify-evenly items-center h-3/4">
                <Link href={"/"}>
                    <HomeIcon className={"w-8"} />
                </Link>
                    {/* TODO - Light/Dark Mode Toggler */}
                <Link href={"/"}>
                    <HomeIcon className={"w-8"} />
                </Link>
                    {/* TODO - Language Selector */}
                <Link href={"/"}>
                    <HomeIcon className={"w-8"} />
                </Link>
                    {/* TODO - Request Song */}
                <Link href={"/"}>
                    <HomeIcon className={"w-8"} />
                </Link>
            </div>
        </div>
    )
}
