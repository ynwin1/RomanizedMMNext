import {requireAdmin} from "@/infrastructure/auth";
import PlaylistForm from "../playlist-form";

export default async function NewPlaylistPage() {
  await requireAdmin();
  return <section><h1 className="text-3xl font-bold">Add Spotify playlist</h1><PlaylistForm /></section>;
}
