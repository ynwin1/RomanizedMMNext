import {getAllSongs} from "@/app/lib/action";
import {MetadataRoute} from "next";

const WEBSITE_URL = 'http://localhost:3000' // TODO - Change this to the actual website URL
const LOCALES = ['en', 'mm']
const SONG_OPTIONS = ['english', 'burmese', 'meaning'] // Added 'meaning' option

const songs = await getAllSongs();
export default function sitemap(): MetadataRoute.Sitemap {
    const routes: MetadataRoute.Sitemap = [];
    // Home Pages for each locale
    LOCALES.forEach(locale => {
        routes.push({
            url: `${WEBSITE_URL}/${locale}`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.9,
        })
    });

    // About Page for each locale
    LOCALES.forEach(locale => {
        routes.push({
            url: `${WEBSITE_URL}/${locale}/about`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.9,
        })
    });
    //
    // // Song Catalog Page for each locale
    LOCALES.forEach(locale => {
        routes.push({
            url: `${WEBSITE_URL}/${locale}/song-catalogue`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        })
    });
    //
    // // Song Request Page for each locale
    LOCALES.forEach(locale => {
        routes.push({
            url: `${WEBSITE_URL}/${locale}/song-request`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        })
    });

    if (songs === null) {
        return routes;
    }

    // Add main song pages and their variations
    songs.forEach((song)  => {
        // Main song pages for each locale
        LOCALES.forEach(locale => {
            routes.push({
                url: `${WEBSITE_URL}/${locale}/song/${song.songName}/${song.mmid}`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.8,
                alternates: {
                    languages: Object.fromEntries(
                        LOCALES.map(alterLocale => [
                            alterLocale,
                            `${WEBSITE_URL}/${alterLocale}/song/${song.songName}/${song.mmid}`
                        ])
                    )
                }
            })

            // Option variations for each main page
            SONG_OPTIONS.forEach(option => {
                routes.push({
                    url: `${WEBSITE_URL}/${locale}/song/${song.songName}/${song.mmid}?option=${option}`,
                    lastModified: new Date(),
                    changeFrequency: 'monthly',
                    priority: 0.7, // Slightly lower priority than main pages
                    alternates: {
                        languages: Object.fromEntries(
                            LOCALES.map(alterLocale => [
                                alterLocale,
                                `${WEBSITE_URL}/${alterLocale}/song/${song.songName}/${song.mmid}?option=${option}`
                            ])
                        )
                    }
                })
            })
        })
    })

    return routes;
}