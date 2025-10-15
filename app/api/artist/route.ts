import connectDB from "@/app/lib/mongodb";
import Artist from "@/app/model/Artist";

export async function POST(req: Request) {
    // save artist to db
    try {
        await connectDB();
        const formData = await req.json();

        console.log('Received formData for artist creation:', formData);

        // split genres by comma and trim spaces
        formData.musicGenre = formData.musicGenre.split(',').map((genre: string) => genre.trim());

        // Validate members field
        if (!formData.members || formData.members.every((member: any) => !member.name)) {
            formData.members = null; // Set to null if no valid members
        }

        const artist = await Artist.create(formData);
        if (!artist) {
            return Response.json({error: 'Failed to create artist'}, {status: 500});
        }

        return Response.json({ artist }, { status: 201 });
    } catch (error) {
        return Response.json({ error: `Failed to create artist with error - ${error}` }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    // update artist in db
    try {
        await connectDB();
        const formData = await req.json();

        if (!formData.slug) {
            console.log('Slug is required for update');
            return Response.json({ error: 'Slug is required for update' }, { status: 400 });
        }

        if (formData._id) {
            delete formData._id;
        }

        // split genres by comma and trim spaces
        formData.musicGenre = formData.musicGenre.split(',').map((genre: string) => genre.trim());

        // Validate members field
        if (!formData.members || formData.members.every((member: any) => !member.name)) {
            formData.members = null; // Set to null if no valid members
        }

        const artist = await Artist.findOneAndUpdate(
            { slug: formData.slug },
            formData,
            { new: true }
        );

        if (!artist) {
            console.log('Failed to update artist or artist not found');
            return Response.json({ error: 'Failed to update artist or artist not found' }, { status: 500 });
        }

        return Response.json({ artist }, { status: 200 });
    } catch (error) {
        return Response.json({ error: `Failed to update artist with error - ${error}` }, { status: 500 });
    }
}