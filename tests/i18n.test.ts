import { describe, expect, it } from "vitest";

import { translate } from "../lib/translations";
import { appLanguages } from "../lib/languages";

describe("interface translations", () => {
  it("provides the navigation and onboarding copy for every supported language", () => {
    for (const language of appLanguages) {
      expect(translate(language.id, "today").length).toBeGreaterThan(0);
      expect(translate(language.id, "welcomeTitle").length).toBeGreaterThan(0);
      expect(translate(language.id, "languageTitle").length).toBeGreaterThan(0);
    }
  });

  it("uses the selected language for distinct navigation labels", () => {
    expect(translate("ru", "settings")).toBe("Настройки");
    expect(translate("en", "settings")).toBe("Settings");
    expect(translate("ja", "today")).toBe("今日");
  });

  it("translates shared editor actions for every supported language", () => {
    for (const language of appLanguages) {
      expect(translate(language.id, "Отмена")).not.toBe("");
      expect(translate(language.id, "Удалить")).not.toBe("");
      expect(translate(language.id, "ПАПКА")).not.toBe("");
      expect(translate(language.id, "ПРИОРИТЕТ")).not.toBe("");
    }
  });
});
