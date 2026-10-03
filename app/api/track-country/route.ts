import { analyticsService } from "@/modules/analytics";

export async function POST(req: Request) {
  try {
    const { country, country_code } = await req.json();

    if (!country || country === "Unknown") {
      return Response.json({ error: "Invalid country name" }, { status: 400 });
    }

    const stat = await analyticsService.trackCountry(country, country_code);

    if (!stat) {
      return Response.json(
        { error: "Failed to create country stat with db error" },
        { status: 500 },
      );
    }

    const { id, ...countryStat } = stat;
    return Response.json(
      { countryStat: { _id: id, ...countryStat } },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      { error: `Failed to create country stat with error - ${error}` },
      { status: 500 },
    );
  }
}
