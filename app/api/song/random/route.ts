import connectDB from "@/app/lib/mongodb";
import Song from "@/app/model/Song";

// Gets a random song
export async function GET() {
    await connectDB();

    try {
        const song = await Song.aggregate([
            { $sample: { size: 1 } },
            {
                $project: {
                    _id: 0,
                    songName: 1,
                    mmid: 1,
                }
            }
        ]);

        if (!song || song.length === 0) {
            return Response.json({ error: "No songs found" }, { status: 404 });
        }

        return Response.json({ success: true, data: song[0] });
    } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
