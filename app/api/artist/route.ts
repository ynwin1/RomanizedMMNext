import { artistService, CreateArtistInput } from "@/modules/artists";

export async function POST(req: Request) {
  let formData: CreateArtistInput;

  try {
    formData = await req.json() as CreateArtistInput;
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const artist = await artistService.createArtist(formData);

    return Response.json({
      artist: {
        _id: artist.id,
        ...artist,
        id: undefined,
        __v: 0,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create artist:", error);
    return Response.json({ error: "Failed to create artist" }, { status: 500 });
  }
}
