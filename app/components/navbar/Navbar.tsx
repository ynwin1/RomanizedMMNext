import React from 'react';
import Link from 'next/link';
import {Menu} from "@/app/components/navbar/menu/Menu";

export const Navbar = () => {
    return (
        <nav className="bg-blue-800 text-white p-4 flex justify-between items-center shadow-xl">
            <Link href="/">
                <p className="text-2xl md:text-2xl lg:text-3xl font-bold hover:text-blue-300">RomanizedMM</p>
            </Link>
            <Menu />
        </nav>
    )
}
