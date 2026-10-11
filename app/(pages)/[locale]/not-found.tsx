import Link from "next/link";
import {getLocale} from "next-intl/server";

export default async function NotFound() {
  const locale = await getLocale();
  const isBurmese = locale === "my";

  return (
    <main className="mx-auto flex min-h-[65vh] w-full max-w-2xl items-center justify-center px-4 py-16 text-center">
      <div className="w-full rounded-xl border border-theme-border bg-surface p-8 sm:p-12">
        <p className="text-5xl font-bold tracking-tight text-accent sm:text-6xl">404</p>
        <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">{isBurmese ? "စာမျက်နှာ မတွေ့ပါ" : "Page not found"}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
          {isBurmese ? "ရှာဖွေနေသော စာမျက်နှာကို မတွေ့ပါ။ အောက်ပါလင့်ခ်များမှ ဆက်လက်ကြည့်ရှုနိုင်ပါတယ်။" : "We couldn't find that page. You can continue exploring RomanizedMM below."}
        </p>
        <nav aria-label="Helpful links" className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href={`/${locale}`} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover">{isBurmese ? "ပင်မစာမျက်နှာ" : "Home"}</Link>
          <Link href={`/${locale}/song-catalogue`} className="inline-flex min-h-11 items-center rounded-lg border border-theme-border bg-surface-raised px-5 text-sm font-semibold text-foreground hover:border-accent hover:text-accent">{isBurmese ? "သီချင်းများ" : "Browse songs"}</Link>
          <Link href={`/${locale}/about`} className="inline-flex min-h-11 items-center rounded-lg border border-theme-border bg-surface-raised px-5 text-sm font-semibold text-foreground hover:border-accent hover:text-accent">{isBurmese ? "အကြောင်း" : "About"}</Link>
        </nav>
      </div>
    </main>
  );
}
