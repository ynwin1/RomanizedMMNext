import {artistService} from "@/modules/artists";
import {NotFoundError} from "@/shared/errors/not-found.error";

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
    const { id, ...artist } = await artistService.getBySlug(slug);
    return Response.json(artist, { status: 200 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }
    return Response.json({ error: `Failed to fetch artist with error - ${error}` }, { status: 500 });
  }
}