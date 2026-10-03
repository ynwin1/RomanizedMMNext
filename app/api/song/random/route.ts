import { songService } from "@/modules/songs";

// Gets a random song
export async function GET() {
    try {
        const song = await songService.getRandomSong();

        if (!song) {
            return Response.json({ error: "No songs found" }, { status: 404 });
        }

        return Response.json({ success: true, data: song });
    } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
