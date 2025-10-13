import React from 'react';
import Link from 'next/link';
import {Menu} from "@/app/components/navbar/menu/Menu";
import Image from 'next/image';
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton, UserButton,
} from '@clerk/nextjs';

export const Navbar = () => {
    return (
        <nav className="relative bg-transparent text-white p-4 flex justify-between items-center top-0 z-50">
            <Link href="/">
                <div className="flex flex-row items-center gap-2 cursor-pointer hover:opacity-60">
                    <Image
                        src="/weblogo.png"
                        alt="RomanizedMM"
                        width={40}
                        height={40}
                        className="border-2 border-white rounded-full max-md:w-12 max-md:h-12 cursor-pointer"
                    />
                    <p className="text-3xl max-md:text-xl font-bold hidden md:block">RomanizedMM</p>
                </div>
            </Link>
            <div className="flex items-center gap-3">
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="bg-white text-black px-5 py-2 text-sm font-medium rounded-full hover:bg-opacity-90 hover:scale-105 transition-all duration-200 shadow-md">
                            Sign In
                        </button>
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <UserButton
                        appearance={{
                            elements: {
                                userButtonAvatarBox: "w-9 h-9 max-md:w-7 max-md:h-7 ring-2 ring-white",
                                userButtonPopoverCard: "bg-black border border-white",
                                userButtonActionButton: "hover:bg-white hover:text-black",
                                userButtonPrimaryButton: "bg-white text-black hover:opacity-80",
                            },
                        }}
                    />
                </SignedIn>
                <Menu />
            </div>
        </nav>
    );
}
