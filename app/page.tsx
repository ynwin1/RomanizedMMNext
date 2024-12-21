import SearchBar from "@/app/components/searchbar/SearchBar";
import Player from "@/app/components/video-player/Player";

export default function Home() {
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-black">
            <Player src="/RMBG.mp4" />
            <div className="relative z-10 flex flex-col items-center justify-center gap-6 text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                    Sing Myanmar, Globally!
                </h2>
                <h4 className="text-lg md:text-2xl lg:text-3xl font-medium">
                    Discover romanized lyrics of your favorite Myanmar songs
                </h4>
                <SearchBar/>
            </div>
        </div>
    );
}