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
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'guess-the-song',
      title: t('guessSong.title'),
      description: t('guessSong.description'),
      href: 'guess-the-song',
      color: 'from-blue-500 to-cyan-600'
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-12">{t('title')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
        {gameModes.map((game) => (
          <div 
            key={game.id}
            className={`bg-gradient-to-br ${game.color} rounded-xl p-8 text-white shadow-lg transform transition-all hover:scale-105`}
          >
            <div className="flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold mb-3">{game.title}</h2>
              <p className="mb-6 text-white/90">{game.description}</p>
              
                <Link       
                  href={`./game-modes/${game.href}`}
                  className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  {t('start')}
                </Link>
            </div>
          </div>
        ))}
        </div>
    </div>
  );
}
