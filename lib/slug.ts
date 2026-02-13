export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function createUniqueSlug(baseValue: string, taken: Set<string>) {
  const base = toSlug(baseValue) || "artist";
  let candidate = base;
  let index = 2;

  while (taken.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  taken.add(candidate);
  return candidate;
}
