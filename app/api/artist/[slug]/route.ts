import Artist from "@/app/model/Artist";
import connectDB from "@/app/lib/mongodb";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  // fetch artist from db
  try {
    await connectDB();
    const { slug } = context.params;
    const artist = await Artist.findOne({ slug }).select("-_id -__v").lean();
    if (!artist) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }
    return Response.json(artist, { status: 200 });
  } catch (error) {
    return Response.json({ error: `Failed to fetch artist with error - ${error}` }, { status: 500 });
  }
}