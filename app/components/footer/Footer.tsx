import React from 'react'
import Link from 'next/link'

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white p-4 flex flex-col items-center gap-4 shadow-xl">
            <div className="flex flex-row justify-around w-full max-w-4xl">
                <Link href="/">
                    <p className="text-2xl font-bold hover:opacity-60">Home</p>
                </Link>
                <Link href="/"> {/* TODO - About Page */}
                    <p className="text-2xl font-bold hover:opacity-60">About</p>
                </Link>
                <Link href="/"> {/* TODO - Request Song Page */}
                    <p className="text-2xl font-bold hover:opacity-60">Request A Song</p>
                </Link>
            </div>
            {/*<p className="text-center">© 2024 RomanizedMM</p>*/}
        </footer>
    )
}
export default Footer;
