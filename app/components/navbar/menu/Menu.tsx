"use client";
import React, {useEffect, useState} from 'react'
import {XMarkIcon, HomeIcon, Bars3Icon} from "@heroicons/react/24/outline"; // Heroicons for icons
import Link from "next/link";
import LanguageSwitcher from "@/app/components/language-switch/LanguageSwitcher";
import {useLocale, useTranslations} from "next-intl";

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
            <button className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <Bars3Icon className="w-10 cursor-pointer hover:opacity-60 hover:rounded" />
            </button>
            {isOpen && <MenuOverlay close={setIsOpen} locale={locale}/>}
        </div>
    )
}

const MenuOverlay = ({ close, locale }: { close: React.Dispatch<React.SetStateAction<boolean>>, locale: string | undefined }) => {
    const translator = useTranslations("Menu");
    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-100 flex flex-col justify-evenly items-center">
            <div className="flex flex-col justify-around items-center h-3/4">
                <button className="hover:scale-90 hover:opacity-80 ease-in" onClick={() => close(false)}>
                    <XMarkIcon className="w-8" />
                </button>
                <Link href={"/"} onClick={() => close(false)}>
                    <HomeIcon className={"w-8 hover:scale-90 hover:opacity-80 ease-in"} />
                </Link>
                <Link href={`/${locale}/about`} onClick={() => close(false)}>
                    <p className="text-xl font-bold hover:opacity-60">{translator("about")}</p>
                </Link>
                <Link href={`/${locale}/song-catalogue?page=1&limit=10`} onClick={() => close(false)}>
                    <p className="text-xl font-bold hover:opacity-60">{translator("catalogue")}</p>
                </Link>
                <Link href={`/${locale}/artist-catalogue`} onClick={() => close(false)}>
                    <p className="text-xl font-bold hover:opacity-60">{translator("artistCatalogue")}</p>
                </Link>
                <Link href={`/${locale}/song-request`} onClick={() => close(false)}>
                    <p className="text-xl font-bold hover:opacity-60">{translator("songRequest")}</p>
                </Link>
                <Link href={`/${locale}/guess-the-lyrics`} onClick={() => close(false)}>
                    <p className="text-xl font-bold hover:opacity-60">{translator("guessTheLyrics")}</p>
                </Link>
                <LanguageSwitcher/>
            </div>
        </div>
    )
}
