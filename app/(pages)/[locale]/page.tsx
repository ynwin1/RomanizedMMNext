import SearchBar from "@/app/components/searchbar/SearchBar";
import Player from "@/app/components/video-player/Player";
import {Navbar} from "@/app/components/navbar/Navbar";
import Footer from "@/app/components/footer/Footer";
import {lusitana} from "@/app/components/fonts/fonts";
import {setRequestLocale} from "next-intl/server";
import React from "react";

interface HomeProps {
    params: Promise<{locale: string}>;
}

export default async function Home({params}: HomeProps) {
    const {locale} = await params;
    // Enable static rendering
    setRequestLocale(locale);

    return (
        <div className={`min-h-screen flex flex-col ${lusitana.className} antialiased`}>
            <Navbar />

            {/* Video background*/}
            <div className="fixed inset-0 w-full h-full">
                <Player src="/RMBG.mp4" />
            </div>

            {/* Main content */}
            <main className="flex-1 flex flex-col">
                <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-6 text-center px-4">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                        Sing Myanmar, Globally!
                    </h2>
                    <h4 className="text-lg md:text-2xl lg:text-3xl font-medium">
                        Discover romanized lyrics of your favorite Myanmar songs
                    </h4>
                    <SearchBar />
                </div>
            </main>

            <Footer />
        </div>
    );
}