export const normalizeArtistCatalogueQuery = (value: string) => value.trim().slice(0, 100);

export function artistCatalogueNamePattern(value: string): RegExp | null {
  const query = normalizeArtistCatalogueQuery(value);
  if (!query) return null;
  return new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}
