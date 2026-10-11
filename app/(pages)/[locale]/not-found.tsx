import React from 'react';
import Link from 'next/link';

const NotFound = () => {
    const suggestedLinks = [
        { href: '/en', text: 'Home' },
        { href: '/en/about', text: 'About' },
    ];

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-background from-white to-gray-100 px-4">
            {/* Main Error Message */}
            <div className="text-center mb-8">
                <h1 className="text-6xl font-bold text-accent mb-4 max-md:text-4xl">404</h1>
                <h2 className="text-3xl text-foreground mb-2 max-md:text-xl">Page Not Found</h2>
                <p className="text-foreground max-w-md">
                    Sorry, we couldn't find the page you're looking for. Here are some helpful links:
                </p>
            </div>

            {/* Suggested Links */}
            <div className="flex flex-wrap justify-center gap-4 max-w-xl">
                {suggestedLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="bg-accent px-6 py-3 text-on-accent rounded-xl hover:bg-accent-hover
                     transition-colors duration-200 shadow-sm hover:shadow-md
                     max-md:px-4 max-md:py-2"
                    >
                        {link.text}
                    </Link>
                ))}
            </div>

            {/* Additional Help */}
            <div className="mt-12 text-center text-foreground">
                <p>Still can't find what you're looking for?</p>
                <Link
                    href="/en/song-catalogue"
                    className="text-foreground hover:text-accent underline mt-2 inline-block"
                >
                    Try searching for songs in our catalogue
                </Link>
            </div>
        </div>
    );
};

export default NotFound;