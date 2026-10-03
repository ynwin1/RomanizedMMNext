// User search text is a literal substring, never an executable regular expression.
export function literalSearch(query: string): RegExp {
  return new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}
