import {requireAdmin} from "@/infrastructure/auth";
import {listMoodometerMissingSongs} from "@/modules/songs";
import MoodometerBackfill from "./moodometer-backfill";

export default async function MoodometerBackfillPage() {
 await requireAdmin();
 const songs=await listMoodometerMissingSongs();
 return <section className="mx-auto max-w-4xl space-y-6">
  <h1 className="text-3xl font-bold">Moodometer draft backfill</h1>
  <p className="text-sm text-zinc-400">Generate missing Moodometer drafts for existing songs. Nothing is published automatically. Each song uses one AI request and can be reviewed individually.</p>
  <MoodometerBackfill initialSongs={songs}/>
 </section>;
}
