"use client";
import React, {useEffect, useState} from 'react'
import {XMarkIcon, HomeIcon, Bars3Icon} from "@heroicons/react/24/outline"; // Heroicons for icons
import Link from "next/link";
import LanguageSwitcher from "@/app/components/language-switch/LanguageSwitcher";

export const Menu = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Prevent scrolling when the menu is open
        // https://www.reddit.com/r/nextjs/comments/1312tna/next_13_how_to_disable_scrolling_on_body_when/
        if (isOpen) {
            document.body.classList.add("overflow-y-hidden")
        } else {
            document.body.classList.remove("overflow-y-hidden")
        }
    })

    return (
        <div>
            <button className="w-8 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <Bars3Icon className="w-8 cursor-pointer hover:opacity-60 hover:rounded" />
            </button>
            {isOpen && <MenuOverlay close={setIsOpen}/>}
        </div>
    )
}

const MenuOverlay = ({ close }: { close: React.Dispatch<React.SetStateAction<boolean>> }) => {
    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col justify-evenly items-center">
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
                <LanguageSwitcher/>
                    {/* TODO - Request Song */}
                <Link href={"/"}>
                    <HomeIcon className={"w-8"} />
                </Link>
            </div>
        </div>
    )
}
