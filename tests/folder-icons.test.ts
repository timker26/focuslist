import { describe, expect, it } from "vitest";

import { folderEmojiOptions, getDefaultFolderEmoji, getDefaultFolderIcon, isFolderIconName } from "../lib/folder-icons";

describe("folder icons", () => {
  it("assigns distinct recognizable icons to the built-in folders", () => {
    expect(getDefaultFolderIcon("Дом")).toBe("home");
    expect(getDefaultFolderIcon("Авто")).toBe("directions-car");
    expect(getDefaultFolderIcon("Работа")).toBe("work");
    expect(getDefaultFolderIcon("Личное")).toBe("person");
  });

  it("uses a general folder icon for a custom folder and validates supported names", () => {
    expect(getDefaultFolderIcon("Путешествия")).toBe("folder");
    expect(isFolderIconName("shopping-bag")).toBe(true);
    expect(isFolderIconName("unknown-icon")).toBe(false);
  });

  it("assigns familiar emoji to built-in folders and falls back to a generic folder emoji", () => {
    expect(getDefaultFolderEmoji("Дом")).toBe("🏠");
    expect(getDefaultFolderEmoji("Авто")).toBe("🚗");
    expect(getDefaultFolderEmoji("Работа")).toBe("💼");
    expect(getDefaultFolderEmoji("Личное")).toBe("✨");
    expect(getDefaultFolderEmoji("Другое")).toBe("📁");
  });

  it("offers an expanded palette for common folder themes", () => {
    expect(folderEmojiOptions.length).toBeGreaterThanOrEqual(40);
    expect(folderEmojiOptions).toEqual(expect.arrayContaining(["🍳", "💰", "🎮", "🧳", "🩺", "🌍"]));
  });
});
