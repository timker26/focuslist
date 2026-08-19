export const folderCoverIds = ["ocean", "sunset", "forest", "violet", "citrus", "rose"] as const;

export type FolderCoverId = typeof folderCoverIds[number];

export const folderCovers: Record<FolderCoverId, { label: string; colors: readonly [string, string] }> = {
  ocean: { label: "Океан", colors: ["#0EA5E9", "#4659E8"] },
  sunset: { label: "Закат", colors: ["#F97316", "#E25D7B"] },
  forest: { label: "Лес", colors: ["#22A06B", "#0F766E"] },
  violet: { label: "Сирень", colors: ["#8B5CF6", "#4659E8"] },
  citrus: { label: "Цитрус", colors: ["#F6C453", "#E89642"] },
  rose: { label: "Роза", colors: ["#EC4899", "#9A55DE"] },
};

export function isFolderCoverId(value: unknown): value is FolderCoverId {
  return typeof value === "string" && folderCoverIds.includes(value as FolderCoverId);
}
