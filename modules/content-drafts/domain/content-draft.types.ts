export interface DraftIdentity {
  songName?: string;
}

export interface DraftSource {
  burmeseLyrics?: string;
}

export interface DraftGeneratedContent {
  romanized?: string;
  meaning?: string;
  about?: string;
  whenToListen?: string;
}

export interface DraftMetadata {
  albumName?: string;
  genre?: string;
  spotifyTrackId?: string;
  spotifyLink?: string;
  appleMusicLink?: string;
  youtubeLinks?: string[];
  imageLink?: string;
  requestedBy?: string;
}

export type DraftArtistReference =
  | {
      kind: "resolved";
      artistId: string;
      name: string;
      slug: string;
    }
  | {
      kind: "unresolved";
      name: string;
    };

export interface ContentDraftEntity {
  id: string;
  ingestionId: string;
  identity: DraftIdentity;
  source: DraftSource;
  generated: DraftGeneratedContent;
  metadata: DraftMetadata;
  artists: DraftArtistReference[];
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface ContentDraftRecord extends ContentDraftEntity {
  revision: number;
}
