import React from 'react';
import Link from 'next/link';
import {Menu} from "@/app/components/navbar/menu/Menu";
import Image from 'next/image';


export const Navbar = () => {
    return (
        <nav className="relative bg-transparent text-white p-4 flex justify-between items-center top-0 z-50">
            <Link href="/">
                <div className="flex flex-row items-center gap-2 cursor-pointer hover:opacity-60">
                    <Image src="/weblogo.png" alt="RomanizedMM" width={40} height={40} className="border-2 border-white rounded-full max-md:w-12 max-md:h-12 cursor-pointer" />
                    <p className="text-3xl max-md:text-xl font-bold hidden md:block">RomanizedMM</p>
                </div>
            </Link>
            <Menu />
        </nav>
    )
}
