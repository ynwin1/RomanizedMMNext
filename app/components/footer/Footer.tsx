import React from 'react'
import Link from 'next/link'

const Footer = () => {
    return (
        <footer className="relative bg-transparent text-white p-4 flex flex-row gap-6 justify-center items-center bottom-0">
            {/*<div className="flex flex-row justify-evenly w-full">*/}
            {/*    <Link href="/">*/}
            {/*        <p className="text-2xl font-bold hover:opacity-60">Home</p>*/}
            {/*    </Link>*/}
            {/*    <Link href="/"> /!* TODO - About Page *!/*/}
            {/*        <p className="text-2xl font-bold hover:opacity-60">About</p>*/}
            {/*    </Link>*/}
            {/*    <Link href="/"> /!* TODO - Request Song Page *!/*/}
            {/*        <p className="text-2xl font-bold hover:opacity-60">Request A Song</p>*/}
            {/*    </Link>*/}
            {/*</div>*/}
            <Link href="/">
                <p className="text-lg font-bold hover:opacity-60">About</p>
            </Link>
            <p>© 2024 RomanizedMM</p>
        </footer>
    )
}
export default Footer;
