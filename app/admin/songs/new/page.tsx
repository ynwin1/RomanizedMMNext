import { requireAdmin } from "@/infrastructure/auth";
import SongForm from "../song-form";

export default async function NewSongPage() {
  await requireAdmin();
  return <section><h1 className="text-3xl font-bold">Create song</h1><SongForm /></section>;
}
