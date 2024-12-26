import connectDB from "@/app/lib/mongodb";
import Song from "@/app/model/Song";
import {NextRequest} from "next/server";

export async function GET(
    request: NextRequest,
    context: { params: { id: string } }
) {
    const { id } = context.params;
    await connectDB();

    try {
        const song = await Song.findOne({
            mmid: id
        }).lean();

        if (!song) {
            return Response.json({ error: "Song not found" }, { status: 404 });
        }

        return Response.json({ success: true, data: song });
    } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
