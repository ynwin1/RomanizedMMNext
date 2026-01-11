
export type SongPageArtist = {
    name: string,
    slug?: string
}

export enum ArtistType {
    Singer = "Singer",
    Duo = "Duo",
    Trio = "Trio",
    Band = "Band",
    Studio = "Studio"
}

export enum TriviaState {
    Start = 'start',
    Playing = 'playing',
    End = 'end'
}