import Artist from "@/app/model/Artist";
import connectDB from "@/app/lib/mongodb";

export async function POST(req: Request) {
    // save artist to db
    try {
        await connectDB();
        const formData = await req.json();

        const artist = await Artist.create(formData);
        if (!artist) {
            return Response.json({error: 'Failed to create artist'}, {status: 500});
        }

        return Response.json({ artist }, { status: 201 });
    } catch (error) {
        return Response.json({ error: `Failed to create artist with error - ${error}` }, { status: 500 });
    }
}