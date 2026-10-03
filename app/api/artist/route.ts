import {artistService, CreateArtistInput} from "@/modules/artists";

export async function POST(req: Request) {
    // save artist to db
    try {
        const formData = await req.json() as CreateArtistInput;
        const artist = await artistService.createArtist(formData);

        return Response.json({
            artist: {
                _id: artist.id,
                ...artist,
                id: undefined,
                __v: 0,
            }
        }, { status: 201 });
    } catch (error) {
        return Response.json({ error: `Failed to create artist with error - ${error}` }, { status: 500 });
    }
}