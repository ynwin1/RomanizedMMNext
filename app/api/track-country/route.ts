import CountryStat from "@/app/model/CountryStat";
import connectDB from "@/app/lib/mongodb";

export async function POST(req: Request) {
    // save or update country count to db
    try {
        await connectDB();
        const { country, country_code } = await req.json();

        const resp = await CountryStat.findOneAndUpdate(
            { code: country_code },
            { $inc: { count: 1 }, $set: { country: country } },
            { upsert: true, new: true }
        );

        if (!resp) {
            return Response.json({ error: 'Failed to create country stat with db error' }, { status: 500 });
        }

        return Response.json({ countryStat: resp }, { status: 201 });
    } catch (error) {
        return Response.json({ error: `Failed to create country stat with error - ${error}` }, { status: 500 });
    }
}

