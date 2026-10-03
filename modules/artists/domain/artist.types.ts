export enum ArtistType {
  Singer = "Singer",
  Duo = "Duo",
  Trio = "Trio",
  Band = "Band",
  Studio = "Studio",
}

export interface ArtistMember {
  name: string;
  imageLink?: string;
  slug?: string;
}

export interface ArtistSocials {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  spotify?: string;
  appleMusic?: string;
}

export interface ArtistEntity {
  id: string;
  name: string;
  slug: string;
  imageLink: string;
  bannerLink?: string;
  biography?: string;
  biographyMy?: string;
  unknownFact?: string;
  type: string;
  members?: ArtistMember[];
  origin?: string[];
  labels?: string[];
  musicGenre: string[];
  songs: number[];
  socials?: ArtistSocials;
  likes: number;
}
