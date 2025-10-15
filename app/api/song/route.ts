import connectDB from "@/app/lib/mongodb";
import Song from "@/app/model/Song";

export async function POST(req: Request) {
    // save song to db
    try {
        await connectDB();
        const formData = await req.json();

        // Add field MMID
        formData.mmid = await generateMMID();

        // Extract Spotify TrackID
        if (formData.spotifyLink && formData.spotifyLink.trim() !== '') {
            formData.spotifyTrackId = extractSpotifyTrackID(formData.spotifyLink);
        }

        // Set general lyrics
        formData.lyrics = formData.burmese;

        const song = await Song.create(formData);
        if (!song) {
            return Response.json({error: 'Failed to create song'}, {status: 500});
        }

        return Response.json({ song }, { status: 201 });
    } catch (error) {
        return Response.json({ error: `Failed to create song with error - ${error}` }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    // update song in db
    try {
        await connectDB();
        const formData = await req.json();

        console.log('Received formData for update:', formData);

        if (!formData.mmid) {
            console.log('MMID is required for update');
            return Response.json({ error: 'MMID is required for update' }, { status: 400 });
        }

        if (formData._id) {
            delete formData._id;
        }

        console.log('Updating song with MMID:', formData.mmid);

        // Extract Spotify TrackID
        if (formData.spotifyLink && formData.spotifyLink.trim() !== '') {
            formData.spotifyTrackId = extractSpotifyTrackID(formData.spotifyLink);
        }

        // Set general lyrics
        formData.lyrics = formData.burmese;

        const song = await Song.findOneAndUpdate(
            { mmid: formData.mmid },
            formData,
            { new: true }
        );
        if (!song) {
            console.log('Failed to update song or song not found');
            return Response.json({ error: 'Failed to update song or song not found' }, { status: 500 });
        }

        console.log('Song updated successfully:', song);
        return Response.json({ song }, { status: 200 });
    } catch (error) {
        return Response.json({ error: `Failed to update song with error - ${error}` }, { status: 500 });
    }
}

async function generateMMID(): Promise<number> {
    const currentCount = await Song.countDocuments({});
    return currentCount + 1;
}

function extractSpotifyTrackID(spotifyLink: string): string {
    // split by '/' and return last part
    const parts = spotifyLink.split('/');
    return parts[parts.length - 1];
}