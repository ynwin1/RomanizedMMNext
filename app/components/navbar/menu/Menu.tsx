"use client";
import React, {useEffect, useState} from 'react'
import {XMarkIcon, HomeIcon, Bars3Icon} from "@heroicons/react/24/outline"; // Heroicons for icons
import Link from "next/link";
import LanguageSwitcher from "@/app/components/language-switch/LanguageSwitcher";
import {useParams} from "next/navigation";
import {useLocale} from "next-intl";

export const Menu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const locale = useLocale();

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
            {isOpen && <MenuOverlay close={setIsOpen} locale={locale}/>}
        </div>
    )
}

const MenuOverlay = ({ close, locale }: { close: React.Dispatch<React.SetStateAction<boolean>>, locale: string | undefined }) => {
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
                <LanguageSwitcher/>
                {/* https://flowbite.com/docs/components/buttons/ */}
                <button
                    className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200 dark:focus:ring-cyan-800">
                    <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                        <Link href={`/${locale}/song-request`}>
                            <p className="text-xl font-bold hover:opacity-60">Request A Song</p>
                        </Link>
                    </span>
                </button>

            </div>
        </div>
    )
}
