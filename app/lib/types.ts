
export type SongPageArtist = {
    name: string,
    slug?: string
}

export { ArtistType } from "@/modules/artists/domain/artist.types";
export enum TriviaState {
    Start = 'start',
    Playing = 'playing',
    End = 'end'
}