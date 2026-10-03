import { ArtistMember, ArtistSocials } from "../domain/artist.types";

export interface ArtistCatalogueRecord {
  name: string;
  slug: string;
  imageLink: string;
  musicGenre: string[];
  type: string;
  songs: number[];
  biography?: string;
}

export interface ArtistCataloguePage {
  artists: ArtistCatalogueRecord[];
  totalPages: number;
}

export interface ArtistProfile {
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

export interface AdminArtistRecord {
  name: string;
  slug: string;
  type: string;
  musicGenre: string[];
  songCount: number;
}
