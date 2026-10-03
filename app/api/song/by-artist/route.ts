import { songService } from "@/modules/songs";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const artist = searchParams.get("artist");
    console.log(`Artist: ${artist}`);

    if (!artist) {
        return Response.json({ error: "No artist provided" }, { status: 400 });
    }

    try {
        const songs = (await songService.getSongsByArtistName(artist)).map(({ id, ...song }) => ({
            _id: id,
            ...song,
        }));
        return Response.json({ success: true, songs });
    } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
