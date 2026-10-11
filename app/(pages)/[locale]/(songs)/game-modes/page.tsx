import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Game Modes',
  description: 'All the music games on RomanizedMM; whether it\'s Guess The Lyrics or Guess The Song',
  openGraph: {
      title: 'Guess The Lyrics',
      description: 'Test your knowledge of Myanmar songs by guessing the lyrics of the songs!',
      images: [
          {
              url: 'https://i.imgur.com/epALhvr.png',
              width: 800,
              height: 600,
              alt: 'Guess The Lyrics',
          }
      ],
      type: 'website',
      siteName: 'RomanizedMM',
  }
};

export default async function GameModesPage() {
  const t = await getTranslations('GameModes');

  const gameModes = [
    {
      id: 'guess-the-lyrics',
      title: t('guessLyrics.title'),
      description: t('guessLyrics.description'),
      href: 'guess-the-lyrics',
      icon: '✍',
    },
    {
      id: 'guess-the-song',
      title: t('guessSong.title'),
      description: t('guessSong.description'),
      href: 'guess-the-song',
      icon: '♫',
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-12 sm:px-6">
        <header className="mb-9 border-b border-theme-border pb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Play &amp; explore</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t('title')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{t('guessLyrics.description')} · {t('guessSong.description')}</p>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {gameModes.map((game) => (
          <article
            key={game.id}
            className="flex flex-col rounded-xl border border-theme-border bg-surface p-6 text-foreground transition-colors hover:border-accent sm:p-8"
          >
            <div aria-hidden="true" className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-raised text-3xl text-accent">{game.icon}</div>
            <h2 className="text-2xl font-bold">{game.title}</h2>
            <p className="mt-3 mb-7 flex-1 text-sm leading-relaxed text-muted sm:text-base">{game.description}</p>
            <Link href={`./game-modes/${game.href}`} className="inline-flex min-h-11 w-fit items-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{t('start')} <span aria-hidden="true" className="ml-2">→</span></Link>
          </article>
        ))}
        </div>
    </main>
  );
}
