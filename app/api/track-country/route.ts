import { analyticsService } from "@/modules/analytics";

export async function POST(req: Request) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "Invalid country payload" }, { status: 400 });
  }

  const { country, country_code } = payload as {
    country?: unknown;
    country_code?: unknown;
  };

  if (typeof country !== "string" || !country || country === "Unknown") {
    return Response.json({ error: "Invalid country name" }, { status: 400 });
  }

  if (typeof country_code !== "string" || !country_code) {
    return Response.json({ error: "Invalid country code" }, { status: 400 });
  }

  try {
    const stat = await analyticsService.trackCountry(country, country_code);

    if (!stat) {
      return Response.json(
        { error: "Failed to create country stat" },
        { status: 500 },
      );
    }

    const { id, ...countryStat } = stat;
    return Response.json(
      { countryStat: { _id: id, ...countryStat } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create country stat:", error);
    return Response.json(
      { error: "Failed to create country stat" },
      { status: 500 },
    );
  }
}
