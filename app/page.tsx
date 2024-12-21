import Image from "next/image";
import SearchBar from "@/app/components/searchbar/SearchBar";

export default function Home() {
  return (
      <div className="flex flex-col items-center justify-center gap-12 min-h-screen py-2">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center">
              Sing Myanmar, Globally!
          </h2>
          <h4 className="text-lg md:text-2xl lg:text-3xl font-medium text-center">
              Discover romanized lyrics of your favorite Myanmar songs
          </h4>
          <SearchBar/>
      </div>
  );
}
