import connectDB from "@/app/lib/mongodb";
import Song from "@/app/model/Song";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query: string | null = searchParams.get("query");

    await connectDB();

    if (!query) {
        return Response.json({ error: "No query provided" }, { status: 400 });
    }

    try {
        const songs = await Song.find({
            songName: { $regex: query, $options: "i" }
        })
            .sort({ songName: 1 })
            .select("songName mmid -_id")
            .lean();

        return Response.json({ success: true, songs: songs });
    } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}