export const folderIconNames = ["home", "directions-car", "work", "person", "folder", "shopping-bag", "event", "build", "school", "favorite"] as const;

export type FolderIconName = typeof folderIconNames[number];

export const folderEmojiOptions = [
  "📁", "🏠", "🚗", "💼", "✨", "🛒", "✈️", "🎓",
  "🏋️", "🛠️", "❤️", "🎯", "📚", "🐾", "🌿", "🎨",
  "🍳", "💰", "📈", "💻", "📱", "🎮", "🎵", "🎬",
  "📸", "🧳", "🧘", "🩺", "💊", "👨‍👩‍👧", "🐶", "🌱",
  "🧹", "🔑", "🧾", "🗓️", "🎁", "💡", "🚀", "🌍",
];

export function getDefaultFolderEmoji(title: string) {
  const normalized = title.trim().toLocaleLowerCase("ru-RU");
  if (normalized === "дом") return "🏠";
  if (normalized === "авто") return "🚗";
  if (normalized === "работа") return "💼";
  if (normalized === "личное") return "✨";
  return "📁";
}

export function isFolderIconName(value: unknown): value is FolderIconName {
  return typeof value === "string" && folderIconNames.includes(value as FolderIconName);
}

export function getDefaultFolderIcon(title: string): FolderIconName {
  const normalized = title.trim().toLocaleLowerCase("ru-RU");
  if (normalized === "дом") return "home";
  if (normalized === "авто") return "directions-car";
  if (normalized === "работа") return "work";
  if (normalized === "личное") return "person";
  return "folder";
}
