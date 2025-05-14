import Artist from "@/app/model/Artist";
import connectDB from "@/app/lib/mongodb";

type Props = {
    params: Promise<{ slug: string }>
}

export async function GET(
    request: Request,
    props: Props
) {
  // fetch artist from db
  try {
    const { slug } = await props.params;
    await connectDB();
    const artist = await Artist.findOne({ slug }).select("-_id -__v").lean();
    if (!artist) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }
    return Response.json(artist, { status: 200 });
  } catch (error) {
    return Response.json({ error: `Failed to fetch artist with error - ${error}` }, { status: 500 });
  }
}