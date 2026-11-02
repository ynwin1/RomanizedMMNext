import {requireAdmin} from "@/infrastructure/auth";
import {exportMoodometerReviewTemplate} from "@/modules/songs";
import ReviewExport from "./review-export";

export default async function MoodometerQualityPage() {
  await requireAdmin();
  const cases = await exportMoodometerReviewTemplate();
  return <main className="mx-auto max-w-3xl space-y-5 p-6">
    <h1 className="text-3xl font-bold">Moodometer quality review</h1>
    <p className="text-sm text-muted">Export published mood scores and independently fill in 1–3 expected moods per song. No AI calls or changes to published scores.</p>
    <ReviewExport cases={cases}/>
  </main>;
}
