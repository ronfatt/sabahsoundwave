export type NewsCategory = "new-release" | "artist-update" | "festival" | "interview" | "industry";

export function classifyNewsCategory(title: string, summary?: string | null): NewsCategory {
  const haystack = `${title} ${summary || ""}`.toLowerCase();

  if (/(festival|concert|tour|showcase|live|gig|event|lineup)/.test(haystack)) {
    return "festival";
  }
  if (/(interview|q&a|behind the scenes|exclusive|talks|speaks|opens up)/.test(haystack)) {
    return "interview";
  }
  if (/(single|album|ep|track|song|release|drops|debut|music video|mv|video rasmi)/.test(haystack)) {
    return "new-release";
  }
  if (/(joins|signs|collab|collaboration|milestone|wins|award|nominated|announce|returns)/.test(haystack)) {
    return "artist-update";
  }
  return "industry";
}

export function parseNewsCategory(value?: string | null): NewsCategory | null {
  if (
    value === "new-release" ||
    value === "artist-update" ||
    value === "festival" ||
    value === "interview" ||
    value === "industry"
  ) {
    return value;
  }
  return null;
}

export function getNewsCategoryPriority(category: NewsCategory) {
  switch (category) {
    case "new-release":
      return 5;
    case "artist-update":
      return 4;
    case "festival":
      return 3;
    case "interview":
      return 2;
    default:
      return 1;
  }
}
