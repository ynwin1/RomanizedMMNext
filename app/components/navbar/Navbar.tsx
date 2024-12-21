import React from 'react';
import Link from 'next/link';
import {Menu} from "@/app/components/navbar/menu/Menu";

export const Navbar = () => {
    return (
        <nav className="bg-transparent text-white p-4 flex justify-between items-center shadow-xl">
            <Link href="/">
                <p className="text-2xl md:text-2xl lg:text-3xl font-bold hover:opacity-60">RomanizedMM</p>
            </Link>
            <Menu />
        </nav>
    )
}
