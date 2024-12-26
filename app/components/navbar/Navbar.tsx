import React from 'react';
import Link from 'next/link';
import {Menu} from "@/app/components/navbar/menu/Menu";

export const Navbar = () => {
    return (
        <nav className="relative bg-transparent text-white p-4 flex justify-between items-center top-0 z-50">
            <Link href="/">
                <p className="text-3xl max-md:text-xl font-bold hover:opacity-60">RomanizedMM</p>
            </Link>
            <Menu />
        </nav>
    )
}
