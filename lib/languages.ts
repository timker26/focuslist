export const appLanguages = [
  { id: "ru", label: "Русский", nativeLabel: "Русский", flag: "🇷🇺" },
  { id: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { id: "es", label: "Español", nativeLabel: "Español", flag: "🇪🇸" },
  { id: "fr", label: "Français", nativeLabel: "Français", flag: "🇫🇷" },
  { id: "de", label: "Deutsch", nativeLabel: "Deutsch", flag: "🇩🇪" },
  { id: "pt", label: "Português", nativeLabel: "Português", flag: "🇧🇷" },
  { id: "zh", label: "中文", nativeLabel: "中文", flag: "🇨🇳" },
  { id: "ar", label: "العربية", nativeLabel: "العربية", flag: "🇸🇦" },
  { id: "hi", label: "हिन्दी", nativeLabel: "हिन्दी", flag: "🇮🇳" },
  { id: "ja", label: "日本語", nativeLabel: "日本語", flag: "🇯🇵" },
] as const;

export type AppLanguage = typeof appLanguages[number]["id"];

export function getLanguage(id: AppLanguage) {
  return appLanguages.find((language) => language.id === id) ?? appLanguages[0];
}

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === "string" && appLanguages.some((language) => language.id === value);
}
