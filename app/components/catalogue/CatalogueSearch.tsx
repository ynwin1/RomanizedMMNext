"use client";

import {useEffect, useState, type FormEvent} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {MagnifyingGlassIcon, XMarkIcon} from "@heroicons/react/24/outline";
import {normalizeCatalogueQuery} from "./catalogue-filter";

export default function CatalogueSearch({initialQuery, locale}: {initialQuery: string; locale: string}) {
  const [query, setQuery] = useState(initialQuery);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  const navigate = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalized = normalizeCatalogueQuery(value);
    if (normalized) params.set("q", normalized);
    else params.delete("q");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, {scroll: false});
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(query);
  };

  return (
    <form role="search" aria-label="Search the song catalogue" onSubmit={submit} className="flex min-w-0 flex-1 items-stretch gap-2">
      <div className="relative min-w-0 flex-1">
        <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input type="search" aria-label="Search songs or artists" value={query} maxLength={100}
          onChange={event => setQuery(event.target.value)}
          placeholder={locale === "my" ? "သီချင်း သို့မဟုတ် အဆိုတော် ရှာရန်" : "Search songs or artists"}
          className="h-11 w-full min-w-0 rounded-lg border border-theme-border bg-surface py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-accent" />
      </div>
      {initialQuery && (
        <button type="button" aria-label="Clear catalogue search" onClick={() => {setQuery(""); navigate("");}}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-theme-border text-muted hover:text-foreground">
          <XMarkIcon aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
      <button type="submit" className="min-h-11 shrink-0 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover">
        {locale === "my" ? "ရှာရန်" : "Search"}
      </button>
    </form>
  );
}
