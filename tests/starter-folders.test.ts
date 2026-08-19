import { describe, expect, it } from "vitest";

import { getStarterFolderTemplates, localizeStarterFolders, mergeStarterFolders, starterFolderTemplates } from "../lib/starter-folders";

describe("starter folders", () => {
  it("adds the default folder set for a pre-existing profile only once", () => {
    const merged = mergeStarterFolders([{ id: "custom-home", title: " дом ", color: "#111111", icon: "home", emoji: "🏠", isPinned: false, coverId: "forest", templates: [], sortOrder: 0, createdAt: "2026-08-17T00:00:00.000Z" }], true);
    expect(merged.map((folder) => folder.title)).toEqual([" дом ", "Авто", "Работа", "Личное"]);
  });

  it("keeps a post-migration folder collection unchanged when the user has removed a starter folder", () => {
    const folders = [{ id: "starter-home", title: "Дом", color: "#2EAD75", icon: "home" as const, emoji: "🏠", isPinned: false, coverId: "forest" as const, templates: [], sortOrder: 0, createdAt: "2026-01-01T00:00:00.000Z" }];
    expect(mergeStarterFolders(folders, false)).toEqual(folders);
  });

  it("uses selected-language starter titles without replacing custom folder names", () => {
    expect(getStarterFolderTemplates("en").map((folder) => folder.title)).toEqual(["Home", "Car", "Work", "Personal"]);
    expect(localizeStarterFolders(starterFolderTemplates, "ar")[0].title).toBe("المنزل");
    expect(localizeStarterFolders([{ ...starterFolderTemplates[0], title: "My home" }], "en")[0].title).toBe("My home");
  });
});
