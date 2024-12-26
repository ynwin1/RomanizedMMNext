"use client"
import React from 'react'
import Link from 'next/link'
import Image from "next/image";

const Footer = () => {
    return (
        <footer className="relative bg-transparent text-white p-4 flex flex-row gap-4 justify-center items-center">
            <Link href={`https://www.facebook.com/p/Romanized-MM-61567473470671/`} target="_blank">
                <Image src="/facebook-icon.png" alt="facebook-icon" width={27} height={27} />
            </Link>
            <Link href={`https://github.com/ynwin1/RomanizedMMNext`} target="_blank">
                <Image src="/github-icon.png" alt="github-icon" width={30} height={30} />
            </Link>
            <p className="text-lg font-semibold max-md:text-[12px]">© 2024 RomanizedMM</p>
        </footer>
    )
}
export default Footer;
