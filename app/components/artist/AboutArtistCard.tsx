import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AboutArtistCardProps {
    locale: string;
    artist: {
        name: string;
        slug: string;
        imageLink: string;
        biography: string;
    }
}

const AboutArtistCard: React.FC<AboutArtistCardProps> = ({ locale, artist }) => {
    return (
        <div className="flex flex-col md:flex-row rounded-xl shadow-lg border border-white border-2 overflow-hidden w-[80vw] max-w-2xl mx-auto">
            <div className="relative w-full h-32 md:w-40 md:h-auto aspect-square md:aspect-auto flex-shrink-0 hover:scale-105 hover:cursor-pointer transition-all duration-300">
                {artist.imageLink && (
                    <Image
                        src={artist.imageLink}
                        alt={artist.name}
                        fill
                        className="object-cover rounded-t-xl md:rounded-l-xl md:rounded-t-none"
                    />
                )}
            </div>

            <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left p-4 gap-2 w-full hover:cursor-pointer">
                <div className="font-bold text-lg md:text-xl mb-1 break-words">
                    {artist.name}
                </div>
                <div className="text-white text-sm md:text-base mb-2 w-full break-words">
                    <span className="block">
                        {artist.biography.slice(0, 130)}...
                    </span>
                </div>
                <Link href={`/${locale}/artist/${artist.slug}`} className="w-full md:w-auto">
                    <button className="w-full md:w-auto bg-blue-600 text-white rounded-xl px-4 py-2 font-semibold hover:bg-blue-400 transition-colors">
                        View
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default AboutArtistCard;