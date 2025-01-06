# RomanizedMM
Official Website - www.romanizedmm.com

Demo - [https://www.youtube.com/watch?v=9P4RoPcO_RM](https://youtu.be/rP2xi7OrS_E)
## About
RomanizedMM is a web application providing romanized lyrics of Myanmar songs to 
music lovers out there who like to sing Myanmar songs along. 

It provides three types of lyrics -
* Romanized lyrics
* Burmese lyrics
* Meaning of each line in the lyrics

Not only these, users will be able to see some basic information like song names,
artist and album names. Also, I really want to make this product unique, so I added a moody summary, and a short description on when best to listen to each song. I really think
users will love this. For convenience, I added a YouTube player when user clicks YouTube button, so they can start the music right there, and sing along! There are also options available for Spotify
and Apple Music if the songs are available on each platform.

There are thousands of Myanmar songs. If a user wants the lyrics but can't find the song, they can submit a song under Song Request page. The information sent by is confidential;
all I will have is the song information you provided, as stated in the form. 

This is the first proper full stack app I have created. This is going to be a continuous long-term project for me, as 
I add more songs for the users. This repository is a migration from (https://github.com/ynwin1/RomanizedMM) which was developed in MERN stack. I have been battling with SEO issues with MERN, and after trying out many options, I decided it would be best to move to Next.js where I can utilize server-side rendering for SEO purposes. About time this project reach its full potential.

## Behind the scenes

I am a Burmese, and I grew up listening to Burmese songs. In the past few years, I started listening to a few foreign countries' songs, especially Thai and Japan.
There are some great songs out there, and I want to sing along, so I tend to google looking for romanized lyrics to sing along. About two years ago, I checked the same for our songs, 
but there was no proper place to find one. There are a few for some famous songs, but you can count how many exist with your fingers. I also notice quite a lot of comments under MTVs of 
Myanmar songs, asking for romanized lyrics or the meanings of all these lyrics. That's when I realized I needed to start one.

I managed to get my hands on it during the winter break of 2023, and here it is, RomanizedMM. My goal here is simple; I want to fill this gap in the market to help Myanmar songs get popular 
because I really think some of them have very good potential to blow up. I want to help promote our songs, and let the world know we have some of the greatests.

## Features

1. Lyrics

   Each song page is defined as "[en|my]/song/[songName]/[songId]?option=[romanized|burmese|meaning]
   The user is able to view each song in two languages, Burmese and English. Each song also has 3 types of lyrics so in total, each song is available in 6 different versions.
2. Song Request

   The user can submit song requests via /song-request page. When the user requests, the song is added to the queue which is visible on the page.
3. Song Catalogue
   
   This is a collection of all the songs on the app. The user is able to navigate through the songs easily here.
4. Guess The Lyrics

   This is intended to be a fun quiz session where the users guess the lyrics. Each question is 15 seconds max and user must select one of the four options.
   If correct, they proceed to the next question. Else, it's game over and if the user beats the lowest score recorded, they can proudly record themselves on the leaderboard.

## Technical

This is a full stack app developed using Next.js w/ TypeScript, Tailwind CSS and MongoDB.

I have been playing around with Next.js for some time already. I decided it might be the best to kick off with this project as I have been wanting to migrate it for some time.

This project uses Next.js v15. I decided to stick to the latest version to get my project stay up to date with the technology.
Because of this, I am using App Router instead of Page Router to take advantage of server components and simpler data fetching.

Using Next.js has eliminated the need to define many API routes, thanks to its ability to fetch data directly on the server side. 
There are only 2 API routes as of now which are all called by the client components.
1. GET /api/song/search?query="songName" - To fetch songs searched by the user in search bar.
2. POST /api/song-request - To create a record for song request in the database and send it to Discord via webhook.

I have 2 models defined for MongoDB.
1. Song and 2. SongRequest

I plan to integrate a dashboard for admin so it is much easier to do it right away from the app. I have this on MERN app, but I will need to do the same for this project.

Libraries Used
- HeroIcons (icons usage)
- Clsx (dynamic tailwind class binding)
- Mongoose (mongodb connections and model definitions)
- Next-Intl (multilingual support)
- React-Interaction-Observer (dynamic positioning of Youtube Player)
- React-Player (to create Youtube Player)
- React-Select (search bar for songs)
- React-Timer-Hook (to time question in GuessTheLyrics)
- Use-Debounce (debouncing database queries on user searching songs)
- Zod (a layer to validate forms)
