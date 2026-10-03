import { ArtistService } from "./application/artist.service";
import { MongoArtistRepository } from "./infrastructure/artist.repository";

const artistRepository = new MongoArtistRepository();

export const artistService = new ArtistService(artistRepository);

export * from "./domain/artist.types";
export * from "./application/artist.dto";
export * from "./application/artist.validation";
export * from "./application/artist-write.error";
