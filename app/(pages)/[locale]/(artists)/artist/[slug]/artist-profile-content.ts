import type {ArtistEntity} from "@/modules/artists";

export function artistBiographyForLocale(artist: Pick<ArtistEntity, "biography" | "biographyMy">, locale: string): string {
  const preferred = locale === "my" ? artist.biographyMy : artist.biography;
  return preferred?.trim() || artist.biography?.trim() || "";
}
