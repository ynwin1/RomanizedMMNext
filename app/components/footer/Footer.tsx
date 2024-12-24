"use client"
import React from 'react'
import Link from 'next/link'
import {useLocale} from "next-intl";

const Footer = () => {
    const locale = useLocale();
    return (
        <footer className="relative bg-transparent text-white p-4 flex flex-row gap-6 justify-center items-center bottom-0">
            <Link href="/">
                <p className="text-lg font-bold hover:opacity-60 max-md:text-sm">About</p>
            </Link>
            <Link href={`/${locale}/song-catalogue`}>
                <p className="text-lg font-bold hover:opacity-60 max-md:text-sm">Catalogue</p>
            </Link>
            <Link href={`/${locale}/song-request`}>
                <p className="text-lg font-bold hover:opacity-60 max-md:text-sm">Song Request</p>
            </Link>
            <p className="text-lg font-bold max-md:text-sm">© 2024 RomanizedMM</p>
        </footer>
    )
}
export default Footer;
