import {NextRequest} from "next/server";
import { songService } from "@/modules/songs";
import { NotFoundError } from "@/shared/errors/not-found.error";

type Props = {
    params: Promise<{ id: string }>
}

export async function GET(
    request: NextRequest,
    props: Props
) {
    const { id } = await props.params;

    try {
        const { id: songId, ...song } = await songService.getByMmid(Number(id));
        return Response.json({ success: true, data: { _id: songId, ...song } });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return Response.json({ error: "Song not found" }, { status: 404 });
        }
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
