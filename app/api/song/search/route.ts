import { songService } from "@/modules/songs";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query: string | null = searchParams.get("query");

    if (!query) {
        return Response.json({ error: "No query provided" }, { status: 400 });
    }

    try {
        const songs = await songService.search(query);
        return Response.json({ success: true, songs });
    } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
