export type Lang = "en" | "ms";

export function parseLang(value?: string | null): Lang {
  return value === "ms" ? "ms" : "en";
}

export function withLang(path: string, lang: Lang) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}lang=${lang}`;
}
