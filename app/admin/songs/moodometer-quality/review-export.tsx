"use client";
import {createMoodometerReviewTemplate} from "@/modules/songs/application/moodometer.review-export";
type Cases=ReturnType<typeof createMoodometerReviewTemplate>;
export default function ReviewExport({cases}:{cases:Cases}) {
  const exportJson=()=>{
    const blob = new Blob([JSON.stringify(cases,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const anchor=document.createElement("a");
    anchor.href=url;anchor.download="moodometer-review.json";
    anchor.click();URL.revokeObjectURL(url);
  };
  return <section className="space-y-4">
    <p>{cases.length} published songs available for review.</p>
    <button type="button" disabled={!cases.length} onClick={exportJson} className="rounded bg-accent px-4 py-2 font-semibold text-background disabled:opacity-50">Export review JSON</button>
    <p className="text-sm text-muted">Fill each empty expectedMoods array with 1–3 valid mood IDs, then run <code>npm run evaluate:moodometer -- moodometer-review.json</code> locally. A sample of 20–30 varied songs is recommended.</p>
  </section>;
}
