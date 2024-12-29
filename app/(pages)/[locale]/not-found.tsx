import React from 'react';
import Link from 'next/link';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center gap-8">
            <h1 className="text-3xl max-md:text-xl">404 - Page Not Found</h1>
            <p>Sorry, the page you are looking for does not exist.</p>
            <Link href="/" className="bg-blue-600 p-4 opacity-80 rounded-2xl hover:bg-blue-950">
                <p>Home</p>
            </Link>
        </div>
    )
}
export default NotFound
