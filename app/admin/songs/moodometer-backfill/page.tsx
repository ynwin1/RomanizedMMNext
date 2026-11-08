import {requireAdmin} from "@/infrastructure/auth";
import {listMoodometerMissingSongs} from "@/modules/songs";
import MoodometerBackfill from "./moodometer-backfill";

export default async function MoodometerBackfillPage() {
 await requireAdmin();
 const songs=await listMoodometerMissingSongs();
 return <section className="mx-auto max-w-4xl space-y-6">
  <h1 className="text-3xl font-bold">Moodometer bulk generation & publishing</h1>
  <p className="text-sm text-zinc-400">Generate and publish missing Moodometer analyses for existing songs. Each song uses one AI request; successful results go live immediately and can be edited later.</p>
  <MoodometerBackfill initialSongs={songs}/>
 </section>;
}
