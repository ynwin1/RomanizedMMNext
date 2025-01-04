import React from 'react';
import Link from 'next/link';

const NotFound = () => {
    const suggestedLinks = [
        { href: '/en', text: 'Home' },
        { href: '/en/about', text: 'About' },
    ];

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-black from-white to-gray-100 px-4">
            {/* Main Error Message */}
            <div className="text-center mb-8">
                <h1 className="text-6xl font-bold text-blue-600 mb-4 max-md:text-4xl">404</h1>
                <h2 className="text-3xl text-white mb-2 max-md:text-xl">Page Not Found</h2>
                <p className="text-white max-w-md">
                    Sorry, we couldn't find the page you're looking for. Here are some helpful links:
                </p>
            </div>

            {/* Suggested Links */}
            <div className="flex flex-wrap justify-center gap-4 max-w-xl">
                {suggestedLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="bg-blue-600 px-6 py-3 text-white rounded-xl hover:bg-blue-700
                     transition-colors duration-200 shadow-sm hover:shadow-md
                     max-md:px-4 max-md:py-2"
                    >
                        {link.text}
                    </Link>
                ))}
            </div>

            {/* Additional Help */}
            <div className="mt-12 text-center text-white">
                <p>Still can't find what you're looking for?</p>
                <Link
                    href="/en/song-catalogue"
                    className="text-white hover:text-blue-800 underline mt-2 inline-block"
                >
                    Try searching for songs in our catalogue
                </Link>
            </div>
        </div>
    );
};

export default NotFound;