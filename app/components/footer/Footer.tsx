"use client"
import React from 'react'
import Link from 'next/link'
import Image from "next/image";

const Footer = () => {
    return (
        <footer className="relative bg-transparent text-white p-4 flex flex-row gap-6 justify-center items-center bottom-0">
            <Link href={`https://www.facebook.com/profile.php?id=61556201697760`} target="_blank">
                <Image src="/facebook-icon.png" alt="facebook-icon" width={27} height={27} />
            </Link>
            <Link href={`https://github.com/ynwin1/RomanizedMMNext`} target="_blank">
                <Image src="/github-icon.png" alt="github-icon" width={30} height={30} />
            </Link>
            <p className="text-lg font-bold max-md:text-sm">© 2024 RomanizedMM</p>
        </footer>
    )
}
export default Footer;
