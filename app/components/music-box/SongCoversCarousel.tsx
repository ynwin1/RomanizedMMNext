"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicSongCover } from "./song-covers.types";
import { nextCoverScrollPosition } from "./song-covers.types";

type Props = { covers: PublicSongCover[]; locale: string };

const copy = {
  en: {
    heading: "Covers & Interpretations",
    subtitle: "Discover how others perform this song",
    back: "Previous covers",
    forward: "Next covers",
    open: "Watch on YouTube",
  },
  my: {
    heading: "ပြန်လည်သီဆိုမှုများနှင့် တီးခတ်ဖျော်ဖြေမှုများ",
    subtitle: "ဒီသီချင်းကို အခြားသူတွေ ဘယ်လိုဖျော်ဖြေထားလဲ ကြည့်ရှုပါ",
    back: "ရှေ့သို့",
    forward: "နောက်သို့",
    open: "YouTube တွင် ကြည့်ရန်",
  },
} as const;

export default function SongCoversCarousel({ covers, locale }: Props) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const strings = locale === "my" ? copy.my : copy.en;

  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    setCanPrev(track.scrollLeft > 2);
    setCanNext(track.scrollLeft < max - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateControls();
    // Fonts, viewport changes and responsive card widths can change overflow.
    const resize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateControls) : null;
    resize?.observe(track);
    window.addEventListener("resize", updateControls);
    return () => {
      resize?.disconnect();
      window.removeEventListener("resize", updateControls);
    };
  }, [covers.length, updateControls]);

  function navigate(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const first = track.querySelector("li");
    if (!first) return;
    const style = window.getComputedStyle(track);
    const gap = Number.parseFloat(style.columnGap || "0") || 0;
    const step = first.getBoundingClientRect().width + gap;
    const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
    const target = nextCoverScrollPosition(track.scrollLeft, direction, step, maximum);
    track.scrollTo({ left: target, behavior: "smooth" });
  }

  if (!covers.length) return null;

  return <section aria-label={strings.heading} className="min-w-0 w-full border-t border-theme-border pt-8">
    <div className="mb-5 flex min-w-0 flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{strings.heading}</h2>
        <p className="mt-1 text-sm text-muted">{strings.subtitle}</p>
      </div>
      {covers.length > 1 && <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => navigate(-1)} disabled={!canPrev}
          aria-label={strings.back}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-theme-border bg-surface text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button type="button" onClick={() => navigate(1)} disabled={!canNext}
          aria-label={strings.forward}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-theme-border bg-surface text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>}
    </div>
    <ul ref={trackRef} onScroll={updateControls}
      tabIndex={0} aria-label={strings.heading}
      className="flex w-full min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4 scroll-smooth [scrollbar-width:thin]">
      {covers.map(cover => <li key={cover.id}
        className="w-full min-w-0 shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]">
        <article className="h-full overflow-hidden rounded-xl border border-theme-border bg-surface">
          <a href={`https://www.youtube.com/watch?v=${cover.youtubeVideoId}`}
            target="_blank" rel="noopener noreferrer"
            aria-label={`${strings.open}: ${cover.title || cover.youtubeVideoId}`}
            className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent">
            <div className="relative aspect-video w-full overflow-hidden bg-background">
              {/* Fixed YouTube ID-based origin: no arbitrary thumbnail URL is rendered. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://i.ytimg.com/vi/${cover.youtubeVideoId}/hqdefault.jpg`}
                alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-full bg-background/80 p-3 text-foreground shadow-md">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </span>
            </div>
            <div className="space-y-2 p-4">
              <h3 className="line-clamp-2 break-words text-sm font-semibold text-foreground group-hover:text-accent">{cover.title || strings.open}</h3>
              {cover.description && <p className="line-clamp-3 break-words text-sm text-muted">{cover.description}</p>}
            </div>
          </a>
        </article>
      </li>)}
    </ul>
  </section>;
}
