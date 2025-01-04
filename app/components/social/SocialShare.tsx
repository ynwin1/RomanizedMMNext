"use client";
import React, { useState } from 'react';
import {useLocale, useTranslations} from "next-intl";

export default function SocialShare({ url, title }: { url: string, title: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const translator = useTranslations("SocialShare");
    const locale = useLocale();

    const shareURLs = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    }

    const shareOptions = [
        {
            name: 'Reddit',
            url: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
            bgColor: 'bg-[#FF4500]',
            hoverColor: 'hover:bg-[#FF5700]'
        },
        {
            name: 'WhatsApp',
            url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
            bgColor: 'bg-[#25D366]',
            hoverColor: 'hover:bg-[#20BD5C]'
        },
        {
            name: 'Telegram',
            url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            bgColor: 'bg-[#0088CC]',
            hoverColor: 'hover:bg-[#0077B5]'
        },
        {
            name: 'LINE',
            url: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
            bgColor: 'bg-[#00B900]',
            hoverColor: 'hover:bg-[#009900]'
        },
        {
            name: 'Email',
            url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
            bgColor: 'bg-[#D14836]',
            hoverColor: 'hover:bg-[#C13522]'
        }
    ];

    const handleShare = (shareUrl: string) => {
        window.open(shareUrl, '_blank');
        setIsOpen(false);
    };

    return (
        <div className="flex items-center justify-center md:space-x-4 max-md:space-y-4 max-md:flex-col">
            <button
                onClick={() => window.open(shareURLs.facebook, '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
                {locale === "en" ? "Share on Facebook" : "Facebook တွင်မျှဝေပါ"}
            </button>
            <button
                onClick={() => window.open(shareURLs.x, '_blank')}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-700 transition-colors border-3 border-white"
            >
                {locale === "en" ? "Share on X" : "X တွင်မျှဝေပါ"}
            </button>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-800 transition-colors"
                >
                    {translator("others")}
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute bg-black bottom-full z-50 mt-2 w-48 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                                {shareOptions.map((option) => (
                                    <button
                                        key={option.name}
                                        onClick={() => handleShare(option.url)}
                                        className={`w-full text-left px-4 py-2 text-white ${option.bgColor} ${option.hoverColor} transition-colors`}
                                    >
                                        {locale === "en" ? `Share on ${option.name}` : `${option.name} တွင်မျှဝေပါ`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>

    );
}