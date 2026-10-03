import { requireAdmin } from "@/infrastructure/auth";
import ArtistForm from "../artist-form";

export default async function NewArtistPage() {
  await requireAdmin();
  return <section><h1 className="text-3xl font-bold">Create artist</h1><ArtistForm /></section>;
}
