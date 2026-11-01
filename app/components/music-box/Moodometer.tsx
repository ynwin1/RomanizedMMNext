import type {MoodScore, MoodId} from "@/modules/songs/domain/moodometer.types";

const moodPresentation: Record<MoodId, {label:string;face:string}> = {
 romantic:{label:"Romantic",face:"🥰"}, nostalgic:{label:"Nostalgic",face:"🥹"},
 heartbroken:{label:"Heartbroken",face:"😢"}, celebratory:{label:"Celebratory",face:"🥳"},
 peaceful:{label:"Peaceful",face:"😌"}, energetic:{label:"Energetic",face:"🤩"},
 melancholic:{label:"Melancholic",face:"😔"}, hopeful:{label:"Hopeful",face:"😊"},
 confident:{label:"Confident",face:"😎"}, angry:{label:"Angry",face:"😠"},
 longing:{label:"Longing",face:"🥺"}, dreamy:{label:"Dreamy",face:"😶‍🌫️"},
 anxious:{label:"Anxious",face:"😰"}, comforting:{label:"Comforting",face:"🤗"},
 playful:{label:"Playful",face:"😜"},
};

export function moodometerBarWidth(score:number): string {
  return `${Math.min(100,Math.max(0,score*10))}%`;
}

export default function Moodometer({moods,locale}:{moods:MoodScore[];locale:string}) {
  const isMyanmar=locale==="my";
  return <section aria-label="Moodometer" className="mx-auto w-full max-w-3xl rounded-xl border border-theme-border bg-surface p-5 sm:p-6">
    <div className="mb-5">
      <h2 className="text-xl font-bold text-foreground">Moodometer</h2>
      <p className="mt-1 text-sm text-muted">{isMyanmar?"သီချင်းစာသားအပေါ် အခြေခံသည့် စိတ်ခံစားချက်များ":"The feelings behind the lyrics"}</p>
    </div>
    <div className="space-y-5">
      {moods.map(mood=>{
        const info=moodPresentation[mood.moodId];
        return <div key={mood.moodId} className="flex items-center gap-3 sm:gap-4">
          <span aria-hidden="true" className="w-10 shrink-0 text-center text-3xl">{info.face}</span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">{info.label}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-accent">{mood.score.toFixed(1)}<span className="text-muted">/10</span></span>
            </div>
            <div role="meter" aria-label={info.label} aria-valuemin={0} aria-valuemax={10} aria-valuenow={mood.score}
              className="h-2.5 w-full overflow-hidden rounded-full bg-theme-border">
              <div className="h-full rounded-full bg-accent" style={{width:moodometerBarWidth(mood.score)}}/>
            </div>
          </div>
        </div>;
      })}
    </div>
    <p className="mt-2 text-xs text-muted">{isMyanmar?"AI က သီချင်းစာသားကို အခြေခံ၍ ခန့်မှန်းထားသော စိတ်ခံစားချက်များ ဖြစ်ပါသည်။":"AI interpretation of the lyrics, not an audio measurement."}</p>
  </section>;
}
