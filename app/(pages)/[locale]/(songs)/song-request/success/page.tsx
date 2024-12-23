import React from 'react'
import FormReturnButton from "@/app/components/buttons/FormReturnButton";

const Page = () => {
    return (
        <main className="flex flex-col gap-10 overflow-y-hidden h-[80vh] items-center justify-center bg-black p-4">
            <p className="text-lg text-center text-white w-full max-w-xl">
                Song requested successfully ✅.
            </p>
            <p className="text-lg text-center text-white w-full max-w-xl">
                It may take a few days, so stay tuned! 🤩
            </p>
            <FormReturnButton url={"/song-request"} />
        </main>
    )
}
export default Page;
