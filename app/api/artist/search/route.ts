import connectDB from "@/app/lib/mongodb";
import Artist from "@/app/model/Artist";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query: string | null = searchParams.get("query");

    await connectDB();

    if (!query) {
        return Response.json({ error: "No query provided" }, { status: 400 });
    }

    try {
        const songs = await Artist.find({
            name: { $regex: query, $options: "i" }
        })
            .sort({ songName: 1 })
            .lean();

        return Response.json({ success: true, songs: songs });
    } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}