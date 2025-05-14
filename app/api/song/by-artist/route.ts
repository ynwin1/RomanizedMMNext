import connectDB from "@/app/lib/mongodb";
import Song from "@/app/model/Song";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const artist = searchParams.get("artist");
    console.log(`Artist: ${artist}`);
    await connectDB();

    if (!artist) {
        return Response.json({ error: "No artist provided" }, { status: 400 });
    }

    try {
        const songs = await Song.find({
            "artistName.name": { $regex: artist, $options: "i" }
        }).sort({ songName: 1 }).lean();

        return Response.json({ success: true, songs });
    } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
