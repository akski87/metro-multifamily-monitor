/** Stable URL-safe id from a display name. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function uniqueSlug(base: string, taken: Set<string>): string {
  let s = slugify(base) || "market";
  if (!taken.has(s)) return s;
  let i = 2;
  while (taken.has(`${s}-${i}`)) i += 1;
  return `${s}-${i}`;
}
