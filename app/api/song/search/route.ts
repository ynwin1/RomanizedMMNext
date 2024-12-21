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
            .select("songName mmid")
            .lean();

        return Response.json({ success: true, data: songs });
    } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}