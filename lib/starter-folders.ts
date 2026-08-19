import type { TaskFolder } from "./tasks-context";
import type { AppLanguage } from "./languages";

const starterFolderDefinitions = [
  { id: "starter-home", titles: { ru: "Дом", en: "Home", es: "Casa", fr: "Maison", de: "Zuhause", pt: "Casa", zh: "家庭", ar: "المنزل", hi: "घर", ja: "ホーム" }, color: "#2EAD75", icon: "home", emoji: "🏠", coverId: "forest" },
  { id: "starter-car", titles: { ru: "Авто", en: "Car", es: "Coche", fr: "Voiture", de: "Auto", pt: "Carro", zh: "汽车", ar: "السيارة", hi: "कार", ja: "車" }, color: "#E89642", icon: "directions-car", emoji: "🚗", coverId: "sunset" },
  { id: "starter-work", titles: { ru: "Работа", en: "Work", es: "Trabajo", fr: "Travail", de: "Arbeit", pt: "Trabalho", zh: "工作", ar: "العمل", hi: "काम", ja: "仕事" }, color: "#4659E8", icon: "work", emoji: "💼", coverId: "ocean" },
  { id: "starter-personal", titles: { ru: "Личное", en: "Personal", es: "Personal", fr: "Personnel", de: "Persönlich", pt: "Pessoal", zh: "个人", ar: "شخصي", hi: "व्यक्तिगत", ja: "個人" }, color: "#9A55DE", icon: "person", emoji: "✨", coverId: "violet" },
] as const;

export function getStarterFolderTemplates(language: AppLanguage): TaskFolder[] {
  return starterFolderDefinitions.map((folder, index) => ({ ...folder, title: folder.titles[language], isPinned: false, templates: [], sortOrder: index, createdAt: "2026-01-01T00:00:00.000Z" }));
}

export const starterFolderTemplates = getStarterFolderTemplates("ru");

export function localizeStarterFolders(folders: TaskFolder[], language: AppLanguage): TaskFolder[] {
  return folders.map((folder) => {
    const definition = starterFolderDefinitions.find((item) => item.id === folder.id);
    if (!definition || !(Object.values(definition.titles) as readonly string[]).includes(folder.title)) return folder;
    return { ...folder, title: definition.titles[language] };
  });
}

export function mergeStarterFolders(folders: TaskFolder[], shouldAddStarterFolders: boolean, language: AppLanguage = "ru") {
  if (!shouldAddStarterFolders) return folders;
  const localizedTemplates = getStarterFolderTemplates(language);
  const existingTitles = new Set(folders.map((folder) => folder.title.trim().toLocaleLowerCase()));
  return [...folders, ...localizedTemplates.filter((folder) => !existingTitles.has(folder.title.toLocaleLowerCase()))];
}
